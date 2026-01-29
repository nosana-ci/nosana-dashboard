<template>
  <div>
    <NuxtPage v-if="$route.params.jobaddress" />
    <template v-else>
      <TopBar
        title="Deployment Overview"
        subtitle="Find information about and manage your deployment here."
      />

      <Loader v-if="loading" />
      <div v-else-if="error" class="box">
        <div class="notification is-danger">
          <p>{{ error }}</p>
        </div>
      </div>

      <div v-else-if="deployment">
        <!-- Unified Card -->
        <div class="box is-borderless">
          <!-- Header Section -->
          <div class="p-5 deployment-header">
            <div
              class="is-flex is-justify-content-space-between is-align-items-start"
            >
              <div class="header-left-section">
                <div class="is-flex is-align-items-center mb-0">
                  <button
                    @click="router.push(`/deployments`)"
                    class="button is-ghost back-button mr-4 pb-1 height-auto"
                  >
                    <span class="icon is-small">
                      <ArrowUpIcon
                        class="icon-16 transform-rotate-270 back-arrow-icon"
                      />
                    </span>
                  </button>
                  <div class="header-title-section">
                    <h1 class="title is-5 has-text-weight-normal mb-1">
                      {{ deployment.name || "Deployment" }}
                    </h1>
                    <p
                      v-if="deployment.name"
                      class="subtitle is-7 has-text-grey is-family-monospace mb-0"
                    >
                      {{ deployment.id }}
                    </p>
                  </div>
                  <StatusTag :status="deployment.status" class="ml-4" />
                </div>
              </div>
              <div class="deployment-tabs">
                <button
                  v-for="tab in availableTabs"
                  :key="tab"
                  @click="switchTab(tab)"
                  :class="{ 'is-active': activeTab === tab }"
                  class="tab-button"
                >
                  {{
                    tab === "configuration"
                      ? "Configuration"
                      : tab.charAt(0).toUpperCase() + tab.slice(1)
                  }}
                </button>
                <!-- Actions Dropdown -->
                <div
                  class="dropdown is-right"
                  :class="{ 'is-active': isActionsDropdownOpen }"
                  ref="actionsDropdown"
                >
                  <div class="dropdown-trigger">
                    <button
                      class="tab-button actions-button"
                      @click="isActionsDropdownOpen = !isActionsDropdownOpen"
                      :class="{ 'is-loading': actionLoading }"
                    >
                      <span>Actions</span>
                      <span
                        class="icon is-small dropdown-arrow ml-1"
                        :class="{ 'is-rotated': isActionsDropdownOpen }"
                      >
                        <ChevronDownIcon />
                      </span>
                    </button>
                  </div>
                  <div class="dropdown-menu">
                    <div class="dropdown-content">
                      <!-- Start Action -->
                      <a
                        v-if="canStart"
                        class="dropdown-item"
                        @click="
                          startDeployment();
                          isActionsDropdownOpen = false;
                        "
                        :disabled="actionLoading"
                      >
                        <span class="icon is-small mr-2">
                          <PlayIcon />
                        </span>
                        <span>Start</span>
                      </a>

                      <!-- Stop Action -->
                      <a
                        v-if="canStop"
                        class="dropdown-item"
                        @click="
                          stopDeployment();
                          isActionsDropdownOpen = false;
                        "
                        :disabled="actionLoading"
                      >
                        <span class="icon is-small mr-2">
                          <SquareIcon />
                        </span>
                        <span>Stop Deployment</span>
                      </a>

                      <!-- Archive Action -->
                      <a
                        v-if="canArchive"
                        class="dropdown-item"
                        @click="
                          archiveDeployment();
                          isActionsDropdownOpen = false;
                        "
                        :disabled="actionLoading"
                      >
                        <span class="icon is-small mr-2">
                          <ArchiveIcon />
                        </span>
                        <span>Archive</span>
                      </a>

                      <hr
                        class="dropdown-divider"
                        v-if="
                          (canStart || canStop || canArchive) &&
                          deployment.status !== 'ARCHIVED'
                        "
                      />

                      <!-- Update Replicas Action -->
                      <a
                        v-if="deployment.status !== 'ARCHIVED'"
                        class="dropdown-item"
                        @click="
                          switchAction('update-replicas');
                          isActionsDropdownOpen = false;
                        "
                        :disabled="actionLoading"
                      >
                        <span class="icon is-small mr-2">
                          <GridIcon />
                        </span>
                        <span>Update Replicas</span>
                      </a>

                      <!-- Update Timeout Action -->
                      <a
                        v-if="deployment.status !== 'ARCHIVED'"
                        class="dropdown-item"
                        @click="
                          switchAction('update-timeout');
                          isActionsDropdownOpen = false;
                        "
                        :disabled="actionLoading"
                      >
                        <span class="icon is-small mr-2">
                          <ClockIcon />
                        </span>
                        <span>Update Timeout</span>
                      </a>

                      <!-- Update Schedule Action (only for scheduled deployments) -->
                      <a
                        v-if="
                          deployment.status !== 'ARCHIVED' &&
                          deployment.strategy?.toUpperCase() === 'SCHEDULED'
                        "
                        class="dropdown-item"
                        @click="
                          switchAction('update-schedule');
                          isActionsDropdownOpen = false;
                        "
                        :disabled="actionLoading"
                      >
                        <span class="icon is-small mr-2">
                          <CalendarIcon />
                        </span>
                        <span>Update Schedule</span>
                      </a>

                      <!-- Create Revision Action -->
                      <a
                        v-if="deployment.status !== 'ARCHIVED'"
                        class="dropdown-item"
                        @click="
                          switchAction('create-revision');
                          isActionsDropdownOpen = false;
                        "
                        :disabled="actionLoading"
                      >
                        <span class="icon is-small mr-2">
                          <EditIcon />
                        </span>
                        <span>Create Revision</span>
                      </a>

                      <div
                        v-if="!hasAnyActions"
                        class="dropdown-item has-text-grey"
                      >
                        <span>No actions available</span>
                      </div>

                      <VaultActions
                        v-if="hasVault && deploymentVault"
                        :vault="deploymentVault"
                        :closeMenu="
                          () => {
                            isActionsDropdownOpen = false;
                          }
                        "
                        :switchAction="switchAction"
                        :isDisabled="actionLoading"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab Content -->
          <div class="p-5">
            <!-- Overview Tab -->
            <div v-if="activeTab === 'overview'">
              <!-- Error Warning -->
              <div v-if="hasErrorInLastEvent" class="notification is-danger mb-5 is-light">
                <div class="is-flex is-align-items-center is-justify-content-space-between">
                  <div>
                    <strong>Deployment Error Detected</strong>
                    <p class="mt-1">An error occurred with this deployment. View the Events tab for more details.</p>
                  </div>
                  <button
                    @click="switchTab('events')"
                    class="button is-danger is-outlined ml-4"
                  >
                    View Events
                  </button>
                </div>
              </div>

              <!-- Endpoints Section -->
              <div v-if="deploymentEndpoints.length > 0" class="mb-5">
                <h2 class="title is-5 mb-3">Endpoints</h2>
                <div class="box is-borderless">
                  <div class="table-container">
                    <table class="table is-fullwidth mb-0" style="table-layout: fixed;">
                      <thead>
                        <tr>
                          <th style="width: 25%;">Operation</th>
                          <th style="width: 10%;">Port</th>
                          <th style="width: 12%;">Status</th>
                          <th style="width: 53%;">URL</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="endpoint in deploymentEndpoints"
                          :key="`${endpoint.opId}-${endpoint.port}`"
                          :style="{ opacity: deployment.status !== 'RUNNING' && deployment.status !== 'STARTING' ? '0.5' : '1' }"
                        >
                          <td>{{ endpoint.opId }}</td>
                          <td>{{ endpoint.port }}</td>
                          <td>
                            <StatusTag
                              :status="deployment.status === 'RUNNING' || deployment.status === 'STARTING' ? 'ACTIVE' : 'INACTIVE'"
                            />
                          </td>
                          <td>
                            <a
                              v-if="deployment.status === 'RUNNING' || deployment.status === 'STARTING'"
                              :href="endpoint.url"
                              target="_blank"
                              class="has-text-link endpoint-url"
                              >{{ endpoint.url }} ↗</a
                            >
                            <span v-else class="has-text-grey-light" style="text-decoration: line-through;">
                              {{ endpoint.url }}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <!-- Job Activity Section -->
              <div class="mb-5">
                <div class="is-flex is-align-items-center mb-3">
                  <h2 class="title is-5 mb-0 mr-3">Job activity</h2>
                  <!-- Job Activity Tabs (only show if 5+ jobs) -->
                  <div v-if="totalJobs >= 5" class="deployment-tabs">
                    <button
                      @click="jobActivityTab = 'active'; historicalJobsPage = 1"
                      class="tab-button is-small"
                      :class="{ 'is-active': jobActivityTab === 'active' }"
                    >
                      Active
                    </button>
                    <button
                      @click="jobActivityTab = 'history'; historicalJobsPage = 1"
                      class="tab-button is-small"
                      :class="{ 'is-active': jobActivityTab === 'history' }"
                    >
                      History
                    </button>
                  </div>
                </div>

                <!-- All Jobs (when tabs are hidden, < 5 jobs) -->
                <div v-if="totalJobs < 5">
                  <div
                    v-if="activeJobs.length === 0 && allHistoricalJobs.length === 0"
                    class="box has-text-centered p-6"
                  >
                    <p class="has-text-grey">
                      <span v-if="deployment.status === 'DRAFT'"
                        >Start deployment to create jobs</span
                      >
                      <span v-else>No jobs yet</span>
                    </p>
                  </div>

                  <div v-else class="box is-borderless">
                    <div class="table-container">
                      <table class="table is-fullwidth mb-0" style="table-layout: fixed;">
                        <thead>
                          <tr>
                            <th style="width: 25%;">Name</th>
                            <th style="width: 10%;">Revision</th>
                            <th style="width: 12%;">Status</th>
                            <th style="width: 18%;">Created on</th>
                            <th style="width: 20%;">Navigation</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="job in [...activeJobs, ...allHistoricalJobs]" :key="job.job">
                            <td style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 0;">
                              <span class="is-family-monospace is-size-7">{{
                                job.job
                              }}</span>
                            </td>
                            <td>
                              {{ job.revision || "-" }}
                            </td>
                            <td>
                              <JobStatus :status="getJobStateNumber(job)" />
                            </td>
                            <td>{{ formatDate(job.created_at) }}</td>
                            <td>
                            <NuxtLink
                                v-if="deployment"
                                :to="`/deployments/${deployment.id}/jobs/${job.job}`"
                                class="has-text-link"
                              >
                                View job
                              </NuxtLink>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <!-- Active Jobs (when tabs are shown, >= 5 jobs) -->
                <div v-else-if="jobActivityTab === 'active'">
                  <div
                    v-if="activeJobs.length === 0"
                    class="box has-text-centered p-6"
                  >
                    <p class="has-text-grey">
                      <span v-if="deployment.status === 'DRAFT'"
                        >Start deployment to create jobs</span
                      >
                      <span v-else>No active jobs</span>
                    </p>
                  </div>

                  <div v-else class="box is-borderless">
                    <div class="table-container">
                      <table class="table is-fullwidth mb-0" style="table-layout: fixed;">
                        <thead>
                          <tr>
                            <th style="width: 25%;">Name</th>
                            <th style="width: 10%;">Revision</th>
                            <th style="width: 12%;">Status</th>
                            <th style="width: 18%;">Created on</th>
                            <th style="width: 20%;">Navigation</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="job in activeJobs" :key="job.job">
                            <td style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 0;">
                              <span class="is-family-monospace is-size-7">{{
                                job.job
                              }}</span>
                            </td>
                            <td>
                              {{ job.revision || "-" }}
                            </td>
                            <td>
                              <JobStatus :status="getJobStateNumber(job)" />
                            </td>
                            <td>{{ formatDate(job.created_at) }}</td>
                            <td>
                            <NuxtLink
                                v-if="deployment"
                                :to="`/deployments/${deployment.id}/jobs/${job.job}`"
                                class="has-text-link"
                              >
                                View job
                              </NuxtLink>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <!-- Historical Jobs -->
                <div v-if="jobActivityTab === 'history'">
                  <div
                    v-if="allHistoricalJobs.length === 0"
                    class="box has-text-centered p-6"
                  >
                    <p class="has-text-grey">No completed jobs yet</p>
                  </div>

                  <div v-else>
                    <div class="box is-borderless">
                      <div class="table-container">
                        <table class="table is-fullwidth mb-0" style="table-layout: fixed;">
                          <thead>
                            <tr>
                              <th style="width: 25%;">Name</th>
                              <th style="width: 10%;">Revision</th>
                              <th style="width: 12%;">Status</th>
                              <th style="width: 15%;">Duration</th>
                              <th style="width: 18%;">Created on</th>
                              <th style="width: 20%;">Navigation</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="job in historicalJobs" :key="job.job">
                              <td style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 0;">
                                <span class="is-family-monospace is-size-7">{{
                                  job.job
                                }}</span>
                              </td>
                              <td>
                                {{ job.revision || "-" }}
                              </td>
                              <td>
                                <JobStatus :status="job.state || 0" />
                              </td>
                              <td>
                              <span v-if="getJobDuration(job.job) !== null">
                                  <SecondsFormatter
                                    :seconds="getJobDuration(job.job) as number"
                                    :showSeconds="true"
                                  />
                                </span>
                                <span v-else>-</span>
                              </td>
                              <td>{{ formatDate(job.created_at) }}</td>
                              <td>
                              <NuxtLink
                                  v-if="deployment"
                                  :to="`/deployments/${deployment.id}/jobs/${job.job}`"
                                  class="has-text-link"
                                >
                                  View job
                                </NuxtLink>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <!-- Pagination for historical jobs -->
                    <div v-if="historicalJobsTotalPages > 1" class="mt-4">
                      <Pagination
                        v-model="historicalJobsPage"
                        :total-page="historicalJobsTotalPages"
                        :max-page="historicalJobsTotalPages"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Deployment Details Section -->
              <div class="mb-5">
                <h2 class="title is-5 mb-3">Deployment details</h2>
                <div class="box is-borderless">
                  <div class="table-container">
                    <table class="table is-fullwidth mb-0" style="table-layout: fixed;">
                      <tbody>
                        <!-- Vault Details Section -->
                        <VaultOverviewRows
                          v-if="hasVault && deploymentVault"
                          :isTableRow="true"
                          :deployment="deployment"
                        />
                        <tr>
                          <td style="width: 25%;">Deployment strategy</td>
                          <td style="width: 75%;">{{ formatStrategy(deployment.strategy) }}</td>
                        </tr>
                        <tr>
                          <td style="width: 25%;">Replicas</td>
                          <td style="width: 75%;">{{ deployment.replicas }}</td>
                        </tr>
                        <tr>
                          <td style="width: 25%;">GPU</td>
                          <td style="width: 75%;" v-if="deployment && deployment.market">
                            <span
                              v-if="
                                testgridMarkets &&
                                testgridMarkets.find(
                                  (tgm: any) =>
                                    tgm.address === deployment?.market
                                )
                              "
                            >
                              {{
                                testgridMarkets.find(
                                  (tgm: any) =>
                                    tgm.address === deployment?.market
                                ).name
                              }}
                            </span>
                            <span v-else>{{ deployment.market }}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="width: 25%;">Container timeout</td>
                          <td style="width: 75%;">
                            <SecondsFormatter
                              v-if="deployment"
                              :seconds="deployment.timeout * 60"
                              :showSeconds="false"
                            />
                          </td>
                        </tr>

                        <!-- Scheduled deployment cron schedule -->
                        <tr
                          v-if="
                            deployment.strategy?.toUpperCase() ===
                              'SCHEDULED' && deploymentSchedule
                          "
                        >
                          <td style="width: 25%;">Schedule</td>
                          <td style="width: 75%;">
                            <div class="is-flex is-flex-direction-column">
                              <span class="is-family-monospace">{{
                                deploymentSchedule
                              }}</span>
                              <span class="is-size-7 has-text-grey mt-1">{{
                                parseCronExpression(deploymentSchedule || "")
                              }}</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="width: 25%;">Created on</td>
                          <td style="width: 75%;">{{ formatDate(deployment.created_at) }}</td>
                        </tr>
                        <tr>
                          <td style="width: 25%;">Last updated on</td>
                          <td style="width: 75%;">{{ formatDate(deployment.updated_at) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <!-- Events Tab -->
            <div v-if="activeTab === 'events'">
              <!-- Upcoming Tasks -->
              <div class="mb-5">
                <div
                  class="is-flex is-justify-content-space-between is-align-items-center mb-3"
                >
                  <h2 class="title is-5 mb-0">Upcoming Tasks</h2>
                  <button
                    class="button is-small"
                    @click="loadTasks()"
                    :class="{ 'is-loading': tasksLoading }"
                    :disabled="tasksLoading"
                    data-tooltip="Refresh upcoming tasks"
                  >
                    <span class="icon is-small">
                      <RefreshIcon />
                    </span>
                  </button>
                </div>

                <div class="box is-borderless">
                  <div class="table-container">
                    <table class="table is-fullwidth mb-0">
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>Task</th>
                          <th>Due Date</th>
                          <th>Deployment ID</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-if="tasks.length === 0 && !tasksLoading">
                          <td
                            colspan="5"
                            class="has-text-centered has-text-grey py-6"
                          >
                            No tasks yet
                          </td>
                        </tr>
                        <tr v-else-if="tasksLoading">
                          <td
                            colspan="5"
                            class="has-text-centered has-text-grey py-6"
                          >
                            <span class="icon is-small mr-2">
                              <i class="fas fa-spinner fa-spin"></i>
                            </span>
                            Loading tasks...
                          </td>
                        </tr>
                        <tr
                          v-else
                          v-for="task in tasks"
                          :key="task.deploymentId + task.created_at"
                        >
                          <td>
                            <StatusTag status="QUEUED" />
                          </td>
                          <td>
                            <span class="tag is-small category-tag">{{
                              task.task
                            }}</span>
                          </td>
                          <td class="has-text-grey">
                            {{ formatDate(task.due_at) }}
                          </td>
                          <td class="is-family-monospace has-text-grey">
                            {{ task.deploymentId }}
                          </td>
                          <td class="has-text-grey">
                            {{ formatDate(task.created_at) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <!-- History -->
              <div>
                <h2 class="title is-5 mb-3">History</h2>

                <div class="box is-borderless">
                  <div class="table-container">
                    <table class="table is-fullwidth mb-0">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Category</th>
                          <th>Message</th>
                          <th>Date</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-if="deploymentEvents.length === 0">
                          <td
                            colspan="5"
                            class="has-text-centered has-text-grey py-6"
                          >
                            No events yet
                          </td>
                        </tr>
                        <tr
                          v-else
                          v-for="(event, index) in deploymentEvents"
                          :key="index"
                        >
                          <td>
                            <span class="tag is-small category-tag">{{
                              event.type
                            }}</span>
                          </td>
                          <td>
                            <span class="tag is-small category-tag">{{
                              event.category
                            }}</span>
                          </td>
                          <td>
                            <span
                              :class="{
                                'is-family-monospace':
                                  event.message.length > 200,
                              }"
                            >
                              {{ event.message }}
                            </span>
                          </td>
                          <td class="has-text-grey">
                            {{ formatDate(event.created_at) }}
                          </td>
                          <td>
                            <a
                              v-if="event.tx"
                              :href="`https://solscan.io/tx/${event.tx}`"
                              target="_blank"
                              class="button is-small is-light"
                              title="View transaction"
                            >
                              TX ↗
                            </a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <!-- Logs Tab -->
            <div v-if="activeTab === 'logs'" class="deployment-logs-container">
              <div
                v-if="allJobsForLogs.length === 0"
                class="notification is-light has-text-centered"
              >
                <p class="has-text-grey">No jobs to show logs for</p>
              </div>
              <div v-else class="deployment-logs-content">
                <!-- Pagination for logs tab -->
                <div v-if="logsJobsTotalPages > 1" class="mb-3">
                  <Pagination
                    v-model="logsJobsPage"
                    :total-page="logsJobsTotalPages"
                    :max-page="logsJobsTotalPages"
                  />
                </div>
                <!-- Job Tabs (show if more than one job on current page) -->
                <div v-if="allJobs.length > 1" class="deployment-tabs mb-3">
                  <button
                    v-for="job in allJobs"
                    :key="job.job"
                    @click="selectJobForLogs(job, true)"
                    :class="{ 'is-active': activeLogsJobId === job.job }"
                    class="tab-button"
                  >
                    {{ job.job.slice(0, 16) }}...
                    <span v-if="getJobStateNumber(job) === 2" class="ml-2 is-size-7 has-text-grey">(completed)</span>
                  </button>
                </div>

                <!-- Selected Job Logs -->
                <div v-if="activeLogsJobId && deployment" class="selected-job-logs">
                  <!-- Show logs for active jobs -->
                  <div v-if="isActiveJob(activeLogsJobId)">
                    <JobLogsContainer :job-id="activeLogsJobId" :deployment-id="deployment.id" />
                  </div>
                  <!-- Show results for completed jobs -->
                  <div v-else-if="isCompletedJob(activeLogsJobId)" class="completed-job-results">
                    <div v-if="loadingJobResults[activeLogsJobId]" class="has-text-centered p-4">
                      <p class="has-text-grey">Loading results...</p>
                    </div>
                    <div v-else-if="completedJobResults[activeLogsJobId] && getJobData(activeLogsJobId)">
                      <JobResult 
                        :ipfs-result="completedJobResults[activeLogsJobId]!" 
                        :ipfs-job="getJobData(activeLogsJobId)!"
                      />
                    </div>
                    <div v-else class="has-text-centered p-4">
                      <p class="has-text-grey">No results available for this job</p>
                    </div>
                  </div>
                </div>
                <!-- No job selected -->
                <div v-else class="has-text-centered p-4">
                  <p class="has-text-grey">Select a job to view logs</p>
                </div>
              </div>
            </div>

            <!-- Configuration Tab -->
            <div v-if="activeTab === 'configuration'">
              <!-- Current Job Configuration Section -->
              <div class="mb-5">
                <div
                  class="is-flex is-justify-content-space-between is-align-items-center mb-3"
                >
                  <h2 class="title is-5 mb-0">Current Job Configuration</h2>
                  <div class="buttons" v-if="hasDefinitionChanged">
                    <button
                      @click="resetDefinition"
                      class="button is-small is-light"
                    >
                      Reset
                    </button>
                    <button
                      @click="makeRevision"
                      class="button is-small is-primary"
                    >
                      Make Revision
                    </button>
                  </div>
                </div>
                <div class="box is-borderless">
                  <div
                    v-if="loadingJobDefinition"
                    class="has-text-grey has-text-centered py-4"
                  >
                    Loading job definition...
                  </div>
                  <div
                    v-else-if="jobDefinitionModel"
                    class="json-editor-container"
                  >
                    <CommonJsonEditor
                      ref="currentJobDefEditor"
                      :modelValue="jobDefinitionModel"
                      :readOnly="false"
                      :validateJobDefinition="true"
                      @update:modelValue="
                        (value: unknown) => {
                          if (value && typeof value === 'object') {
                            jobDefinitionModel = value as JobDefinition;
                          }
                        }
                      "
                    />
                  </div>
                  <div v-else class="has-text-grey has-text-centered py-4">
                    No job definition found
                  </div>
                </div>
              </div>

              <!-- Revisions Section -->
              <div class="mb-4">
                <h2 class="title is-5 mb-3">Deployment Revisions</h2>
                <div
                  v-if="
                    deployment?.revisions && deployment.revisions.length > 0
                  "
                  class="box is-borderless"
                >
                  <div class="table-container">
                    <table class="table is-fullwidth">
                      <thead>
                        <tr>
                          <th>Revision</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="revision in sortedRevisions"
                          :key="revision.revision"
                        >
                          <td>
                            <span class="has-text-weight-semibold">{{
                              revision.revision
                            }}</span>
                          </td>
                          <td>
                            <StatusTag
                              :status="
                                revision.revision === deployment.active_revision
                                  ? 'COMPLETED'
                                  : 'INACTIVE'
                              "
                              :customLabel="
                                revision.revision === deployment.active_revision
                                  ? 'ACTIVE'
                                  : undefined
                              "
                              :showLabel="true"
                              :imageOnly="false"
                            />
                          </td>
                          <td class="has-text-grey">
                            {{ formatDate(revision.created_at) }}
                          </td>
                          <td>
                            <div class="buttons are-small">
                              <button
                                v-if="
                                  revision.revision !==
                                  deployment.active_revision
                                "
                                @click="switchToRevision(revision.revision)"
                                class="button is-primary is-small"
                                :class="{
                                  'is-loading':
                                    switchingRevision === revision.revision,
                                }"
                                :disabled="
                                  actionLoading || switchingRevision !== null
                                "
                              >
                                Make Active
                              </button>
                              <button
                                @click="viewRevisionDefinition(revision)"
                                class="button is-light is-small"
                              >
                                View Configuration
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div v-else class="notification is-light has-text-centered">
                  <p>No revisions found for this deployment.</p>
                  <p class="has-text-grey is-size-7 mt-2">
                    Create a new revision using the Actions menu.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Update Replicas Modal -->
      <div
        v-if="deployment"
        class="modal"
        :class="{ 'is-active': showReplicasModal }"
      >
        <div class="modal-background" @click="showReplicasModal = false"></div>
        <div class="modal-card has-limited-width-smaller">
          <header class="modal-card-head">
            <p class="modal-card-title">Update Replicas</p>
            <button class="delete" @click="showReplicasModal = false"></button>
          </header>
          <section class="modal-card-body">
            <div class="field">
              <label class="label">
                Replica Count
                <span
                  class="icon is-small has-tooltip-arrow has-tooltip-right"
                  data-tooltip="Number of parallel job instances"
                >
                  <InfoCircleIcon />
                </span>
              </label>
              <div class="control">
                <input
                  type="number"
                  class="input"
                  v-model.number="newReplicaCount"
                  min="1"
                  max="100"
                  :placeholder="deployment.replicas.toString()"
                />
              </div>
              <p class="help">Current: {{ deployment.replicas }}</p>
            </div>
          </section>
          <footer class="modal-card-foot is-justify-content-flex-end">
            <button class="button" @click="showReplicasModal = false">
              Cancel
            </button>
            <button
              class="button is-success"
              @click="
                updateReplicas();
                showReplicasModal = false;
              "
              :class="{ 'is-loading': actionLoading }"
              :disabled="
                actionLoading || !newReplicaCount || newReplicaCount < 1
              "
            >
              Update
            </button>
          </footer>
        </div>
      </div>

      <!-- Update Timeout Modal -->
      <div
        v-if="deployment"
        class="modal"
        :class="{ 'is-active': showTimeoutModal }"
      >
        <div class="modal-background" @click="showTimeoutModal = false"></div>
        <div class="modal-card has-limited-width-smaller">
          <header class="modal-card-head">
            <p class="modal-card-title">Update Timeout</p>
            <button class="delete" @click="showTimeoutModal = false"></button>
          </header>
          <section class="modal-card-body">
            <div class="field">
              <label class="label">
                Timeout (hours)
                <span
                  class="icon is-small has-tooltip-arrow has-tooltip-right"
                  data-tooltip="Maximum runtime before auto-shutdown"
                >
                  <InfoCircleIcon />
                </span>
              </label>
              <div class="control">
                <input
                  type="number"
                  class="input"
                  v-model.number="newTimeoutHours"
                  min="0.0167"
                  step="0.1"
                  :placeholder="(deployment.timeout / 60).toFixed(2)"
                />
              </div>
              <p class="help">
                Current: {{ (deployment.timeout / 60).toFixed(2) }}h
              </p>
            </div>
          </section>
          <footer class="modal-card-foot is-justify-content-flex-end">
            <button class="button" @click="showTimeoutModal = false">
              Cancel
            </button>
            <button
              class="button is-success"
              @click="
                updateJobTimeout();
                showTimeoutModal = false;
              "
              :class="{ 'is-loading': actionLoading }"
              :disabled="
                actionLoading || !newTimeoutHours || newTimeoutHours < 0.0167
              "
            >
              Update
            </button>
          </footer>
        </div>
      </div>

      <!-- Update Schedule Modal -->
      <div
        v-if="deployment"
        class="modal"
        :class="{ 'is-active': showScheduleModal }"
      >
        <div class="modal-background" @click="showScheduleModal = false"></div>
        <div class="modal-card has-limited-width-small">
          <header class="modal-card-head">
            <p class="modal-card-title">Update Schedule</p>
            <button class="delete" @click="showScheduleModal = false"></button>
          </header>
          <section class="modal-card-body">
            <div class="field">
              <label class="label">
                Cron Expression
                <span
                  class="icon is-small has-tooltip-arrow"
                  data-tooltip="Cron expression defining when jobs should run. Format: minute hour day month day-of-week"
                >
                  <InfoCircleIcon />
                </span>
              </label>
              <div class="control">
                <input
                  type="text"
                  class="input is-family-monospace"
                  v-model="newSchedule"
                  :placeholder="deploymentSchedule || '0 * * * *'"
                />
              </div>
              <p class="help">
                <span
                  >Current:
                  <span class="is-family-monospace has-text-dark">{{
                    deploymentSchedule
                  }}</span></span
                ><br />
                <span class="has-text-grey">{{
                  deploymentSchedule
                    ? parseCronExpression(deploymentSchedule)
                    : ""
                }}</span>
              </p>
              <div v-if="newSchedule" class="mt-3">
                <p class="help">
                  <span
                    >Preview:
                    <span class="is-family-monospace has-text-dark">{{
                      newSchedule
                    }}</span></span
                  ><br />
                  <span class="has-text-grey">{{
                    parseCronExpression(newSchedule)
                  }}</span>
                </p>
              </div>
            </div>

            <div class="content">
              <p class="has-text-grey is-size-7 mb-2">
                <strong>Common examples:</strong>
              </p>
              <div class="tags">
                <span
                  class="tag is-light is-clickable"
                  @click="newSchedule = '0 * * * *'"
                >
                  <span class="is-family-monospace mr-1 has-text-dark"
                    >0 * * * *</span
                  >
                  Every hour
                </span>
                <span
                  class="tag is-light is-clickable"
                  @click="newSchedule = '*/30 * * * *'"
                >
                  <span class="is-family-monospace mr-1 has-text-dark"
                    >*/30 * * * *</span
                  >
                  Every 30 min
                </span>
                <span
                  class="tag is-light is-clickable"
                  @click="newSchedule = '0 0 * * *'"
                >
                  <span class="is-family-monospace mr-1 has-text-dark"
                    >0 0 * * *</span
                  >
                  Daily
                </span>
                <span
                  class="tag is-light is-clickable"
                  @click="newSchedule = '0 0 * * 0'"
                >
                  <span class="is-family-monospace mr-1 has-text-dark"
                    >0 0 * * 0</span
                  >
                  Weekly
                </span>
              </div>
            </div>
          </section>
            <footer class="modal-card-foot is-justify-content-flex-end">
              <button class="button" @click="showScheduleModal = false">
                Cancel
              </button>
              <button
                class="button is-success"
                @click="
                  updateSchedule();
                  showScheduleModal = false;
                "
                :class="{ 'is-loading': actionLoading }"
              :disabled="
                actionLoading ||
                !newSchedule ||
                !isValidCronExpression(newSchedule)
              "
            >
              Update
            </button>
          </footer>
        </div>
      </div>

      <!-- Create Revision Modal -->
      <div
        v-if="deployment"
        class="modal"
        :class="{ 'is-active': showRevisionModal }"
      >
        <div class="modal-background" @click="showRevisionModal = false"></div>
        <div class="modal-card modal-card-wide">
          <header class="modal-card-head">
            <p class="modal-card-title">Create New Revision</p>
            <button class="delete" @click="showRevisionModal = false"></button>
          </header>
          <section class="modal-card-body has-min-height-500">
            <div class="field full-height">
              <div class="control full-height">
                <CommonJsonEditor
                  ref="revisionJobDefEditor"
                  v-model="revisionJobDefinition"
                  :validateJobDefinition="true"
                  class="has-height-500"
                />
              </div>
            </div>
          </section>
          <footer class="modal-card-foot is-justify-content-flex-end">
            <button class="button" @click="showRevisionModal = false">
              Cancel
            </button>
            <button
              class="button is-success"
              @click="createRevision()"
              :class="{ 'is-loading': actionLoading }"
              :disabled="actionLoading"
            >
              Create Revision
            </button>
          </footer>
        </div>
      </div>

      <!-- View Revision Definition Modal -->
      <div
        v-if="viewingRevision"
        class="modal"
        :class="{ 'is-active': showRevisionDefinitionModal }"
      >
        <div
          class="modal-background"
          @click="showRevisionDefinitionModal = false"
        ></div>
        <div class="modal-card modal-card-wide">
          <header class="modal-card-head">
            <p class="modal-card-title">
              Revision {{ viewingRevision.revision }} - Job Configuration
            </p>
            <button
              class="delete"
              @click="showRevisionDefinitionModal = false"
            ></button>
          </header>
          <section class="modal-card-body has-min-height-500">
            <div
              v-if="viewingRevision.job_definition"
              class="json-editor-container"
            >
              <CommonJsonEditor
                v-model="viewingRevision.job_definition"
                :readOnly="true"
              />
            </div>
            <div v-else class="has-text-grey has-text-centered py-4">
              No job definition found for this revision
            </div>
          </section>
          <footer class="modal-card-foot is-justify-content-flex-end">
            <button class="button" @click="showRevisionDefinitionModal = false">
              Close
            </button>
          </footer>
        </div>
      </div>
    </template>
  </div>
  <VaultModal />
</template>

<script setup lang="ts">
import type { Deployment, JobDefinition } from "@nosana/kit";
import { useVaultModal } from "~/composables/useVaultModal";
import { updateVaultBalance } from "~/composables/useDeploymentVault";
import { useToast } from "vue-toastification";
import { useWallet } from "@nosana/solana-vue";
import { useAuth } from "#imports";
import JobStatus from "~/components/Job/Status.vue";
import JobLogsContainer from "~/components/Job/LogsContainer.vue";
import JobResult from "~/components/Job/Result.vue";
import type { ResultsSection } from "~/composables/jobs/types";
import SecondsFormatter from "~/components/SecondsFormatter.vue";
import StatusTag from "~/components/Common/StatusTag.vue";
import VaultModal from "~/components/Vault/Modal/VaultModal.vue";
import VaultActions from "~/components/Vault/VaultActions.vue";
import Pagination from "~/components/Pagination.vue";

// Import icons as components
import ArrowUpIcon from "@/assets/img/icons/arrow-up.svg?component";
import ChevronDownIcon from "@/assets/img/icons/chevron-down.svg?component";
import PlayIcon from "@/assets/img/icons/play.svg?component";
import SquareIcon from "@/assets/img/icons/square.svg?component";
import ArchiveIcon from "@/assets/img/icons/archive.svg?component";
import GridIcon from "@/assets/img/icons/grid.svg?component";
import ClockIcon from "@/assets/img/icons/clock.svg?component";
import CalendarIcon from "@/assets/img/icons/calendar.svg?component";
import EditIcon from "@/assets/img/icons/edit.svg?component";
import RefreshIcon from "@/assets/img/icons/refresh.svg?component";
import InfoCircleIcon from "@/assets/img/icons/info-circle.svg?component";
import { useTimestamp } from "@vueuse/core";
import { useKit } from "~/composables/useKit";
import { parseCronExpression } from "~/utils/parseCronExpression";

const colorMode = useColorMode();

// Types - use kit's types directly
type DeploymentJob = NonNullable<Deployment['jobs']>[number];

interface DeploymentRevision {
  revision: number;
  created_at: string;
  job_definition?: JobDefinition;
}

interface DeploymentEndpoint {
  opId: string;
  port: number | string;
  url: string;
}

// Use SDK Deployment as-is; access extra fields via guarded indexing

interface DeploymentEvent {
  type: string;
  category: string;
  message: string;
  created_at: string;
  deploymentId: string;
  tx?: string;
}

// Composables
const route = useRoute();
const router = useRouter();
const toast = useToast();
const { open: openVaultModal, state: vaultModalState } = useVaultModal();
const { status, token } = useAuth();
const { connected, account } = useWallet();

// Compatibility: create publicKey-like object from account
const publicKey = computed(() => {
  if (!account.value?.address) return null;
  return {
    toString: () => account.value!.address,
    toBase58: () => account.value!.address,
  };
});

const isAuthenticated = computed(
  () => status.value === "authenticated" && token.value
);
const isWalletMode = computed(
  () => connected.value && account.value?.address && !token.value
);
const hasAnyAuth = computed(() => isAuthenticated.value || isWalletMode.value);
const { getIpfs } = useIpfs();
const { nosana } = useKit();

// State
const deployment = ref<Deployment | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const activeTab = ref("overview");

// Available tabs - always show logs tab
const availableTabs = computed(() => {
  return ["overview", "logs", "events", "configuration"];
});

// Initialize activeTab from URL query parameter
const initialTab = route.query.tab?.toString();
if (initialTab && ["overview", "logs", "events", "configuration"].includes(initialTab)) {
  activeTab.value = initialTab;
}
const activeLogsJobId = ref<string | null>(null);
const userSelectedJob = ref<boolean>(false); // Track if user manually selected a job
const jobActivityTab = ref("active");
const completedJobResults = ref<Record<string, ResultsSection | null>>({});
const loadingJobResults = ref<Record<string, boolean>>({});

// Pagination for job activity
const jobsPerPage = 10;
const activeJobsPage = ref(1);
const historicalJobsPage = ref(1);

// Pagination for logs tab
const logsJobsPage = ref(1);
const actionLoading = ref(false);
const newReplicaCount = ref<number | null>(null);
const newTimeoutHours = ref<number | null>(null);
const newSchedule = ref<string>("");
const tasks = ref<any[]>([]);
const tasksLoading = ref(false);
const isActionsDropdownOpen = ref(false);
const showReplicasModal = ref(false);
const showTimeoutModal = ref(false);
const showScheduleModal = ref(false);
const showRevisionModal = ref(false);
const revisionJobDefinition = ref<JobDefinition | null>(null);
const switchingRevision = ref<number | null>(null);
const showRevisionDefinitionModal = ref(false);
const viewingRevision = ref<any>(null);
const actionsDropdown = ref<HTMLElement | null>(null);

// Polling intervals and state
const pollingTimeout = ref<NodeJS.Timeout | null>(null);
const pollingConfig = {
  normal: 10000,
  fast: 2000,
};

// Available actions
const availableActions = [
  "create-revision",
  "update-replicas",
  "update-timeout",
  "update-schedule",
  "topup",
  "withdraw",
];

// Initialize action from URL query parameter
const initialAction = route.query.action?.toString();
if (initialAction && availableActions.includes(initialAction)) {
  if (initialAction === "create-revision") showRevisionModal.value = true;
  else if (initialAction === "update-replicas") showReplicasModal.value = true;
  else if (initialAction === "update-timeout") showTimeoutModal.value = true;
  else if (initialAction === "update-schedule") showScheduleModal.value = true;
  // Vault actions will be handled when deploymentVault loads
}
// Debug instrumentation for page header icon
const headerIconRef = ref<HTMLElement | null>(null);
const { data: testgridMarkets } = useAPI("/api/markets", { default: () => [] });
// Safe accessors for optional DM fields
const deploymentSchedule = computed<string | null>(() => {
  const d = deployment.value as unknown as { schedule?: string } | null;
  return d?.schedule ?? null;
});

// Use API-provided deployment.status as-is for display
// Auto-start deployments when status is DRAFT
const autostartTriggered = ref(false);
watch(
  () => deployment.value?.status,
  async (status) => {
    if (
      status === "DRAFT" &&
      !autostartTriggered.value &&
      hasAnyAuth.value &&
      !actionLoading.value &&
      !isWalletMode.value
    ) {
      autostartTriggered.value = true;
      try {
        await startDeployment();
      } catch (e) {
        // ignore; actions already handle toasts
      }
    }
  },
  { immediate: true }
);

const attachSmilDebugListeners = (svgEl: SVGElement, label: string) => {
  try {
    const animations = svgEl.querySelectorAll("animateTransform");
    animations.forEach((anim: any) => {
      if (anim.__dbg) return;
      // attach to initialise timeline without logging
      anim.addEventListener("beginEvent", () => {});
      anim.addEventListener("repeatEvent", () => {});
      anim.addEventListener("endEvent", () => {});
      anim.__dbg = true;
    });
  } catch {}
};

const instrumentHeaderIcon = () => {
  const svg = headerIconRef.value?.querySelector("svg") as SVGElement | null;
  if (!svg || !deployment.value) return;
  attachSmilDebugListeners(
    svg,
    `dep=${deployment.value.id} status=${deployment.value.status}`
  );
};

watch(
  () => deployment.value?.status,
  () => nextTick(instrumentHeaderIcon),
  { immediate: true }
);
const statusPollingInterval = ref<NodeJS.Timeout | null>(null);
const jobPollingInterval = ref<NodeJS.Timeout | null>(null);

// Adaptive polling state tracking
const adaptivePollingState = ref<{
  isFastPolling: boolean;
  expectedStatus?: string;
  fastPollStartTime?: number;
}>({
  isFastPolling: false,
});

// Add debugging for polling state
const pollingDebug = ref({
  statusPollingActive: false,
  jobPollingActive: false,
  lastStatusPoll: null as Date | null,
  lastJobPoll: null as Date | null,
});

// Computed properties for revisions
const sortedRevisions = computed<DeploymentRevision[]>(() => {
  const dep = deployment.value as unknown as {
    revisions?: DeploymentRevision[];
  } | null;
  return Array.isArray(dep?.revisions) ? dep!.revisions! : [];
});

const formatDate = (dateString: string | Date) => {
  return new Date(dateString).toLocaleString();
};

const formatStrategy = (strategy: string | undefined | null): string => {
  if (!strategy) return "-";
  return strategy.toLowerCase().replace(/-/g, " ");
};

const jobDefinitionModel = ref<JobDefinition | null>(null);
const loadingJobDefinition = ref(false);
const originalDefinition = ref<JobDefinition | null>(null);

// Editor refs and validation
const currentJobDefEditor = ref<{ hasErrors: boolean } | null>(null);
const revisionJobDefEditor = ref<{ hasErrors: boolean } | null>(null);
const { canSave: canSaveCurrent } = useJsonEditorValidation(currentJobDefEditor);
const { canSave: canSaveRevision } = useJsonEditorValidation(revisionJobDefEditor);

const loadJobDefinition = async () => {
  // Try to get job definition from deployment revisions first
  const d = deployment.value as unknown as {
    revisions?: DeploymentRevision[];
    active_revision?: number;
  } | null;
  if (Array.isArray(d?.revisions) && d!.revisions!.length > 0) {
    const activeRevision =
      d!.revisions!.find(
        (r: DeploymentRevision) => r.revision === d!.active_revision
      ) || d!.revisions![d!.revisions!.length - 1];

    if (activeRevision?.job_definition) {
      jobDefinitionModel.value = activeRevision.job_definition;
      originalDefinition.value = JSON.parse(
        JSON.stringify(activeRevision.job_definition)
      );
      return;
    }
  }

  // Fallback to IPFS if no job definition in revisions
  const ipfsHash = (
    deployment.value as unknown as { ipfs_definition_hash?: string } | null
  )?.ipfs_definition_hash;
  if (!ipfsHash) {
    jobDefinitionModel.value = null;
    return;
  }

  try {
    loadingJobDefinition.value = true;
    const definition = await getIpfs(ipfsHash);
    jobDefinitionModel.value = definition as JobDefinition;
    originalDefinition.value = JSON.parse(
      JSON.stringify(definition)
    ) as JobDefinition;
  } catch (err: any) {
    console.error("Error loading job definition:", err);
    jobDefinitionModel.value = null;
  } finally {
    loadingJobDefinition.value = false;
  }
};

const hasDefinitionChanged = computed(() => {
  if (!originalDefinition.value) return false;
  try {
    // Ensure both are valid objects before comparing
    const original = JSON.stringify(originalDefinition.value);
    const current = JSON.stringify(jobDefinitionModel.value);
    return original !== current;
  } catch (err) {
    // If JSON.stringify fails, there are changes (invalid JSON)
    return true;
  }
});

const resetDefinition = () => {
  if (originalDefinition.value) {
    jobDefinitionModel.value = JSON.parse(
      JSON.stringify(originalDefinition.value)
    );
  }
};

const makeRevision = async () => {
  if (!deployment.value || !hasDefinitionChanged.value) return;

  // Check for validation errors
  if (!canSaveCurrent('Cannot create revision: Please fix the errors in the job definition')) {
    return;
  }

  try {
    const { data } = await useAPI(
      `/api/deployments/${deployment.value.id}/revisions`,
      {
        method: "POST",
        body: { job_definition: jobDefinitionModel.value },
        auth: true,
      }
    );

    if (data.value) {
      toast.success("Revision created successfully!");
      await loadDeployment();
      originalDefinition.value = JSON.parse(
        JSON.stringify(jobDefinitionModel.value)
      );
    }
  } catch (err: any) {
    console.error("Error creating revision:", err);
    toast.error(`Failed to create revision: ${err.message}`);
  }
};

const loadDeployment = async (silent = false) => {
  // Skip parent deployment fetch when on job subroute
  if ((route.params as any)?.jobaddress) {
    if (!silent) loading.value = false;
    return;
  }
  if (!hasAnyAuth.value) {
    error.value = "Please log in or connect wallet to view deployments";
    if (!silent) loading.value = false;
    return;
  }

  // Wait for SDK to be ready (wallet set for wallet users)
  if (isWalletMode.value && !nosana.value.wallet) {
    // Wait for the SDK watch to set the wallet - try multiple times
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (nosana.value.wallet) {
        break;
      }
    }
    // If still not ready, wait for next tick
    if (!nosana.value.wallet) {
      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  try {
    // Only show loading for non-silent operations (initial load, user actions)
    if (!silent) {
      loading.value = true;
      error.value = null;
    }

    const deploymentId = route.params.id as string;
    if (preloadedDeployment.value && preloadedDeployment.value.id === deploymentId) {
      applyDeploymentSnapshot(preloadedDeployment.value);
      preloadedDeployment.value = null;
      if (!silent) {
        await loadJobDefinition();
        await loadTasks();
      }
      // Watcher will handle fast polling when status becomes RUNNING
      return;
    }

    const data = await nosana.value.api.deployments.get(deploymentId);

    applyDeploymentSnapshot(data as Deployment);

    // Only load job definition and tasks on initial load, not during polling
    // This prevents tasks loading state from being reset during background polling
    if (!silent) {
      await loadJobDefinition();
      await loadTasks();
    }

  } catch (err: any) {
    console.error("Error loading deployment:", err);
    // Only set error for non-silent operations
    if (!silent) {
      error.value = `Failed to load deployment: ${err.message}`;
    }
  } finally {
    if (!silent) loading.value = false;
  }
};

// Action button visibility
const deploymentStatus = computed(() =>
  deployment.value?.status?.toUpperCase()
);

const canStart = computed(() => {
  const status = deploymentStatus.value;
  return status === "DRAFT" || status === "STOPPED" || status === "ERROR";
});

const canStop = computed(() => {
  const status = deploymentStatus.value;
  return status === "RUNNING" || status === "STARTING";
});

const canArchive = computed(
  () =>
    deploymentStatus.value !== "ARCHIVED" &&
    deploymentStatus.value !== "RUNNING" &&
    deploymentStatus.value !== "STOPPING" &&
    deploymentStatus.value !== "DRAFT"
);

const hasAnyActions = computed(() => {
  const status = deploymentStatus.value;
  const hasMainActions = canStart.value || canStop.value || canArchive.value;
  const hasConfigActions = status !== "ARCHIVED";
  return hasMainActions || hasConfigActions;
});

// Show withdraw only when deployment exposes a vault with withdraw (wallet mode)
const hasVault = computed(() => {
  if (!deployment.value || typeof deployment.value !== "object") return false;
  return "vault" in deployment.value;
});

const deploymentVault = computed(() => {
  if (
    !hasVault.value ||
    !deployment.value ||
    typeof deployment.value.vault !== "object"
  )
    return null;
  return (deployment.value as any).vault;
});

// Job activity split
// Job states and data extracted from deployment response
// The deployment.jobs array includes state, time_start, and other job info
const jobStates = ref<Record<string, number>>({});
const allJobsData = ref<Record<string, any>>({});
const preloadedDeployment = useState<Deployment | null>("preloadedDeployment", () => null);

const applyDeploymentSnapshot = (dep: Deployment) => {
  deployment.value = dep;
  jobStates.value = {};
  allJobsData.value = {};
  if (dep.jobs) {
    for (const job of dep.jobs) {
      const stateNum = jobStateStringToNumber(job.state);
      jobStates.value[job.job] = stateNum;
      allJobsData.value[job.job] = job;
    }
  }
};

// Check if there are any active jobs (QUEUED=0, RUNNING=1, or STOPPED=3)
// We keep polling for STOPPED jobs just like RUNNING jobs
const hasActiveJobs = computed(() => {
  return Object.values(jobStates.value).some(state => state === 0 || state === 1 || state === 3);
});




// Running job duration (for concise timeout row suffix)
const firstRunningJobId = computed<string | null>(() => {
  const entries = Object.entries(jobStates.value || {});
  const running = entries.find(([id, st]) => st === 1);
  return running ? running[0] : null;
});

const nowTs = useTimestamp({ interval: 1000 });
const runningJobDurationSeconds = computed<number | null>(() => {
  const jobId = firstRunningJobId.value;
  if (!jobId) return null;
  
  const jobData = allJobsData.value[jobId];
  if (!jobData) return null;
  
  const timeStart = jobData.timeStart || jobData.time_start;
  if (!timeStart || timeStart === 0) return null;
  
  const state = jobData.state;
  const isRunning = state === 1 || (typeof state === "string" && String(state).toUpperCase() === "RUNNING");
  if (!isRunning) return null;
  
  return Math.max(0, Math.floor(nowTs.value / 1000) - timeStart);
});

// Function to get duration for individual jobs
const getJobDuration = (jobId: string): number | null => {
  const jobState = jobStates.value[jobId];
  const jobData = allJobsData.value[jobId];

  const timeStart = jobData?.timeStart || jobData?.time_start;
  if (!timeStart) return null;

  const timeEnd = jobData?.timeEnd || jobData?.time_end || jobData?.timeFinished || jobData?.time_finished;

  // For completed jobs, use timeEnd - timeStart
  if (timeEnd && jobState !== undefined && jobState >= 2) {
    return Math.max(0, timeEnd - timeStart);
  }

  // For running jobs, use current time - timeStart
  if (jobState === 1) {
    return Math.max(0, Math.floor(nowTs.value / 1000) - timeStart);
  }

  return null;
};

// Helper function to convert job state string to number
const jobStateStringToNumber = (state: string | number | undefined): number => {
  if (typeof state === 'number') return state;
  if (!state) return 0;
  
  const stateUpper = String(state).toUpperCase();
  const stateMap: Record<string, number> = {
    'QUEUED': 0,
    'RUNNING': 1,
    'COMPLETED': 2,
    'STOPPED': 3,
  };
  
  return stateMap[stateUpper] ?? 0;
};

// Helper to get numeric state from a job
const getJobStateNumber = (job: DeploymentJob): number => {
  return jobStateStringToNumber(job.state);
};

const activeJobs = computed((): DeploymentJob[] => {
  const jobs = deployment.value?.jobs || [];
  // Filter for active jobs (states: QUEUED=0, RUNNING=1) - exclude COMPLETED=2 and STOPPED=3
  return jobs.filter((job) => {
    const state = getJobStateNumber(job);
    return state === 0 || state === 1;
  });
});

// All historical jobs (for pagination) - includes COMPLETED and STOPPED
const allHistoricalJobs = computed((): DeploymentJob[] => {
  const jobs = deployment.value?.jobs || [];
  // Filter for completed and stopped jobs (state: COMPLETED=2, STOPPED=3)
  return jobs.filter((job) => {
    const state = getJobStateNumber(job);
    return state === 2 || state === 3;
  });
});

// Paginated historical jobs
const historicalJobs = computed((): DeploymentJob[] => {
  const all = allHistoricalJobs.value;
  const start = (historicalJobsPage.value - 1) * jobsPerPage;
  const end = start + jobsPerPage;
  return all.slice(start, end);
});

// Total pages for historical jobs
const historicalJobsTotalPages = computed(() => {
  return Math.ceil(allHistoricalJobs.value.length / jobsPerPage);
});

// Total jobs count for determining if tabs should be shown
const totalJobs = computed(() => activeJobs.value.length + allHistoricalJobs.value.length);

// All jobs for logs tab (paginated)
const allJobsForLogs = computed(() => {
  const all = [...activeJobs.value, ...allHistoricalJobs.value];
  // Sort by created_at descending (most recent first)
  return [...all].sort((a, b) => {
    const aTime = (a as any).created_at ? new Date((a as any).created_at).getTime() : 0;
    const bTime = (b as any).created_at ? new Date((b as any).created_at).getTime() : 0;
    return bTime - aTime;
  });
});

// Paginated jobs for logs tab
const allJobs = computed(() => {
  const all = allJobsForLogs.value;
  const start = (logsJobsPage.value - 1) * jobsPerPage;
  const end = start + jobsPerPage;
  return all.slice(start, end);
});

// Total pages for logs tab
const logsJobsTotalPages = computed(() => {
  return Math.ceil(allJobsForLogs.value.length / jobsPerPage);
});

// Helper functions for job logs
const isActiveJob = (jobId: string): boolean => {
  return activeJobs.value.some(job => job.job === jobId);
};

const isCompletedJob = (jobId: string): boolean => {
  return historicalJobs.value.some(job => job.job === jobId);
};

const getJobData = (jobId: string) => {
  return allJobs.value.find(job => job.job === jobId);
};

// Fetch results for a completed job from the deployment manager (node)
const fetchJobResults = async (jobId: string) => {
  if (!isCompletedJob(jobId) || !deployment.value?.id || completedJobResults.value[jobId] !== undefined) return;
  
  loadingJobResults.value[jobId] = true;
  try {
    const dep = await nosana.value.api.deployments.get(deployment.value.id);
    const jobResponse = await (dep as any).getJob(jobId);
    const jobResult = (jobResponse as any)?.jobResult;
    
    if (!jobResult) {
      completedJobResults.value[jobId] = null;
      return;
    }
    
    // Convert to ResultsSection format
    completedJobResults.value[jobId] = {
      status: jobResult.status ?? 'stopped',
      startTime: jobResult.startTime ?? 0,
      endTime: jobResult.endTime ?? 0,
      opStates: (jobResult.opStates || []).map((op: any) => ({
        operationId: op.operationId ?? '',
        status: op.status ?? '',
        startTime: op.startTime ?? 0,
        endTime: op.endTime ?? 0,
        exitCode: op.exitCode,
        results: op.results,
        logs: op.logs ?? [],
      })),
    };
  } catch (error) {
    console.error(`Failed to fetch results for job ${jobId}:`, error);
    const errorDetails = error as { status?: number; statusText?: string; message?: string; data?: any; response?: any };
    if (errorDetails.status === 500) {
      console.error(`Backend returned 500 for job ${jobId}. This is a backend schema validation error - the jobResult doesn't match the expected schema. Error:`, errorDetails.message || errorDetails.data);
    }
    completedJobResults.value[jobId] = null;
  } finally {
    loadingJobResults.value[jobId] = false;
  }
};

// Select job for logs display
const selectJobForLogs = async (job: DeploymentJob, isUserSelection = false) => {
  activeLogsJobId.value = job.job;
  if (isUserSelection) {
    userSelectedJob.value = true;
  }
  
  // If it's a completed job, fetch its results
  if (isCompletedJob(job.job)) {
    await fetchJobResults(job.job);
  }
};

// Deployment endpoints
const deploymentEndpoints = computed(() => {
  if (!deployment.value?.endpoints) return [];
  
  return (deployment.value.endpoints as DeploymentEndpoint[]).map(
    (endpoint: DeploymentEndpoint) => ({
      opId: endpoint.opId,
      port: endpoint.port,
      url: endpoint.url,
    })
  );
});

// All deployment events
const deploymentEvents = computed((): DeploymentEvent[] => {
  return (deployment.value?.events as DeploymentEvent[]) || [];
});

// Check if last event contains ERROR
const hasErrorInLastEvent = computed(() => {
  const events = deploymentEvents.value;
  if (events.length === 0) return false;
  const lastEvent = events[0];
  return lastEvent?.type.endsWith('ERROR') && lastEvent?.category.includes('Deployment');
});

// No vault actions in API mode

// Generic deployment action handler (credit system via API)
const executeDeploymentAction = async (
  action: () => Promise<void>,
  successMessage: string,
  shouldRedirect = false
) => {
  if (!deployment.value || !hasAnyAuth.value) {
    toast.error("Please log in or connect wallet to perform this action");
    return;
  }

  try {
    actionLoading.value = true;
    await action();
    toast.success(successMessage);

    if (shouldRedirect) {
      setTimeout(() => router.push("/deployments"), 2000);
    } else {
      // Wait a moment for backend to process, then refresh
      await new Promise((resolve) => setTimeout(resolve, 500));
      await loadDeployment(true);

    }
  } catch (err: any) {
    console.error("Deployment action error:", err);
    toast.error(`Failed: ${err.message || err.toString()}`);
  } finally {
    if (!shouldRedirect) {
      actionLoading.value = false;
    }
  }
};

// Deployment action methods
const startDeployment = async () => {
  if (!deployment.value) {
    toast.error("Deployment is not loaded yet");
    return;
  }
  
  // Check vault balance before starting deployment (wallet mode only)
  if (isWalletMode.value && deployment.value.vault) {
    try {
      const vaultBalance = await deployment.value.vault.getBalance();
      const hasSol = vaultBalance.SOL > 0;
      const hasNos = vaultBalance.NOS > 0;
      
      if (!hasSol && !hasNos) {
        toast.error("Vault has no balance. Please top up your vault with both SOL and NOS before starting the deployment.");
        return;
      } else if (!hasSol) {
        toast.error("Vault needs SOL for transaction fees. Please top up your vault with SOL before starting the deployment.");
        return;
      } else if (!hasNos) {
        toast.error("Vault needs NOS for job costs. Please top up your vault with NOS before starting the deployment.");
        return;
      }
    } catch (error) {
      console.error("Error checking vault balance:", error);
      toast.error("Failed to check vault balance. Please try again.");
      return;
    }
  }
  
  await executeDeploymentAction(
    () => deployment.value!.start(),
    "Deployment started successfully"
  );

  // Start fast polling expecting RUNNING status
  startFastPolling("RUNNING");
};

const stopDeployment = async () => {
  if (!deployment.value) {
    toast.error("Deployment is not loaded yet");
    return;
  }
  await executeDeploymentAction(
    () => deployment.value!.stop(),
    "Deployment stopped successfully"
  );

  // Force refresh job states to update running jobs to stopped state
  await loadDeployment(true);

  // Only stop job polling if there are no queued or running jobs
  if (!hasActiveJobs.value) {
    stopJobPolling();
  }

  // Start fast polling expecting STOPPED status
  startFastPolling("STOPPED");
};

const archiveDeployment = async () => {
  if (
    !confirm(
      "Are you sure you want to archive this deployment? This action cannot be undone."
    )
  ) {
    return;
  }
  if (!deployment.value) {
    toast.error("Deployment is not loaded yet");
    return;
  }
  await executeDeploymentAction(
    () => deployment.value!.archive(),
    "Deployment archived successfully",
    true
  );
};

const withdrawVault = async () => {
  if (!deployment.value) return;
  await executeDeploymentAction(
    () => (deployment.value as any).vault.withdraw(),
    "Vault withdrawn to your wallet"
  );
};

const updateReplicas = async () => {
  if (!newReplicaCount.value || newReplicaCount.value < 1) {
    toast.error("Replica count must be at least 1");
    return;
  }

  const currentStatus = deployment.value?.status?.toUpperCase();
  await executeDeploymentAction(
    () => deployment.value!.updateReplicaCount(newReplicaCount.value as number),
    `Replica count updated to ${newReplicaCount.value}`
  );

  newReplicaCount.value = null;

  // Start fast polling if deployment is running (jobs will change)
  if (currentStatus === "RUNNING" || currentStatus === "STARTING") {
    startFastPolling("RUNNING");
  }
};

const updateJobTimeout = async () => {
  if (!newTimeoutHours.value || newTimeoutHours.value < 0.0167) {
    toast.error("Timeout must be at least 1 minute (0.0167 hours)");
    return;
  }

  const currentStatus = deployment.value?.status?.toUpperCase();
  await executeDeploymentAction(
    () => deployment.value!.updateTimeout(Math.round((newTimeoutHours.value as number) * 3600)),
    `Job timeout updated to ${newTimeoutHours.value} hours`
  );

  newTimeoutHours.value = null;

  // Start fast polling if deployment is running (jobs might change)
  if (currentStatus === "RUNNING" || currentStatus === "STARTING") {
    startFastPolling("RUNNING");
  }
};

const updateSchedule = async () => {
  if (!newSchedule.value || !isValidCronExpression(newSchedule.value)) {
    toast.error("Please enter a valid cron expression");
    return;
  }

  if (!deployment.value || !hasAnyAuth.value) {
    toast.error("Please log in or connect wallet to perform this action");
    return;
  }

  const currentStatus = deployment.value?.status?.toUpperCase();
  try {
    actionLoading.value = true;
    await deployment.value.updateSchedule(newSchedule.value);

    toast.success(
      `Schedule updated to: ${newSchedule.value} (${parseCronExpression(newSchedule.value)})`
    );

    // Wait a moment for backend to process, then refresh
    await new Promise((resolve) => setTimeout(resolve, 500));
    await loadDeployment(true);

    // Start fast polling if deployment is running (jobs might change)
    if (currentStatus === "RUNNING" || currentStatus === "STARTING") {
      startFastPolling("RUNNING");
    }

    newSchedule.value = "";
  } catch (error: any) {
    console.error("Update schedule error:", error);
    const errorMessage =
      error.data?.message || error.message || "Failed to update schedule";
    toast.error(`Error updating schedule: ${errorMessage}`);
  } finally {
    actionLoading.value = false;
  }
};

const createRevision = async () => {
  if (!revisionJobDefinition.value) {
    toast.error("Please provide a valid job definition");
    return;
  }

  // Check for validation errors
  if (!canSaveRevision('Cannot create revision: Please fix the errors in the job definition')) {
    return;
  }

  if (!deployment.value || !hasAnyAuth.value) {
    toast.error("Please log in or connect wallet to perform this action");
    return;
  }

  try {
    actionLoading.value = true;
    await deployment.value.createRevision(revisionJobDefinition.value);

    toast.success("New revision created successfully!");
    showRevisionModal.value = false;

    // Wait a moment for backend to process, then refresh
    await new Promise((resolve) => setTimeout(resolve, 500));
    await loadDeployment(true);
  } catch (error: any) {
    console.error("Create revision error:", error);
    const errorMessage =
      error.data?.message || error.message || "Failed to create revision";
    toast.error(`Error creating revision: ${errorMessage}`);
  } finally {
    actionLoading.value = false;
  }
};

// Switch to a different revision
const switchToRevision = async (revisionNumber: number) => {
  if (!deployment.value || !hasAnyAuth.value) {
    toast.error("Please log in or connect wallet to perform this action");
    return;
  }

  try {
    switchingRevision.value = revisionNumber;
    await deployment.value.updateActiveRevision(revisionNumber);

    toast.success(`Switched to revision ${revisionNumber} successfully!`);

    // Refresh deployment data
    await loadDeployment(true);
  } catch (error: any) {
    console.error("Switch revision error:", error);
    const errorMessage =
      error.data?.message || error.message || "Failed to switch revision";
    toast.error(`Error switching revision: ${errorMessage}`);
  } finally {
    switchingRevision.value = null;
  }
};

// View a revision's job definition
const viewRevisionDefinition = (revision: any) => {
  viewingRevision.value = revision;
  showRevisionDefinitionModal.value = true;
};

const isValidCronExpression = (cron: string): boolean => {
  if (!cron) return false;

  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return false;

    // Basic validation for each part
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;

      // Allow wildcard
      if (part === "*") continue;

      // Allow step values (*/n)
      if (part.startsWith("*/")) {
        const stepValue = parseInt(part.slice(2));
        if (isNaN(stepValue) || stepValue <= 0) return false;
        continue;
      }

      // Allow ranges (n-m) and lists (n,m,...)
      if (part.includes("-") || part.includes(",")) continue;

      // Check if it's a valid number
      const num = parseInt(part);
      if (isNaN(num)) return false;

    // Validate ranges for each position
    switch (i) {
      case 0: // minute (0-59)
        if (num < 0 || num > 59) return false;
        break;
      case 1: // hour (0-23)
        if (num < 0 || num > 23) return false;
        break;
      case 2: // day of month (1-31)
        if (num < 1 || num > 31) return false;
        break;
      case 3: // month (1-12)
        if (num < 1 || num > 12) return false;
        break;
      case 4: // day of week (0-7, where 0 and 7 are Sunday)
        if (num < 0 || num > 7) return false;
        break;
    }
  }

  return true;
};

const loadTasks = async (silent = false) => {
  if (!deployment.value) {
    return;
  }

  if (silent !== true) tasksLoading.value = true;

  try {
    const result = await deployment.value.getTasks();
    tasks.value = result || [];
  } catch (err: any) {
    console.error("Load tasks error:", err);
    // Silent polling shouldn't spam toasts
    if (!silent) {
      console.error(`Failed to load tasks: ${err.message}`);
    }
  } finally {
    tasksLoading.value = false;
  }
};

const stopAllPolling = () => {
  if (pollingTimeout.value) {
    clearTimeout(pollingTimeout.value);
    pollingTimeout.value = null;
  }
  pollingDebug.value.statusPollingActive = false;
  pollingDebug.value.jobPollingActive = false;
};

const startUnifiedPolling = (intervalMs = pollingConfig.normal) => {
  stopAllPolling();

  pollingDebug.value.statusPollingActive = true;
  pollingDebug.value.jobPollingActive = true;

  const poll = async () => {
    if (!deployment.value) {
      pollingTimeout.value = setTimeout(poll, intervalMs);
      return;
    }

    pollingDebug.value.lastStatusPoll = new Date();
    pollingDebug.value.lastJobPoll = new Date();

    // Load deployment and jobs
    await loadDeployment(true);
    
    // Also load tasks periodically
    await loadTasks(true);

    const currentStatus = (deployment.value?.status || "").toUpperCase();

    // For fast polling: keep it active for at least 30 seconds
    // This ensures we catch immediate changes even if status matches immediately
    if (adaptivePollingState.value.isFastPolling && 
        adaptivePollingState.value.fastPollStartTime) {
      const elapsed = Date.now() - adaptivePollingState.value.fastPollStartTime;
      
      // If expectedStatus is set and matches current status, wait at least 10 seconds
      // If expectedStatus is undefined (already in desired state), wait 30 seconds
      const minDuration = adaptivePollingState.value.expectedStatus ? 10000 : 30000;
      
      if (elapsed >= minDuration) {
        // Check if expected state transition occurred (only if expectedStatus was set)
        const expectedReached = adaptivePollingState.value.expectedStatus && 
          currentStatus === adaptivePollingState.value.expectedStatus.toUpperCase();
        
        // Switch back to normal polling if min duration passed and (expected reached OR no expected status)
        if (expectedReached || !adaptivePollingState.value.expectedStatus) {
          adaptivePollingState.value.isFastPolling = false;
          adaptivePollingState.value.expectedStatus = undefined;
          adaptivePollingState.value.fastPollStartTime = undefined;
          startUnifiedPolling(pollingConfig.normal);
          return;
        }
      }
    }

    const finalStates = ["STOPPED", "ARCHIVED", "ERROR"];
    if (finalStates.includes(currentStatus) && !hasActiveJobs.value) {
      stopAllPolling();
      return;
    }

    // Schedule next poll if not stopped
    pollingTimeout.value = setTimeout(poll, intervalMs);
  };

  pollingTimeout.value = setTimeout(poll, intervalMs);
};

// Legacy helpers for compatibility with existing watchers
const startTasksPolling = () => startUnifiedPolling();
const stopTasksPolling = () => {}; // Handled by stopAllPolling
const startDeploymentPolling = (intervalMs?: number) => startUnifiedPolling(intervalMs);
const stopDeploymentPolling = () => {}; // Handled by stopAllPolling
const startJobPolling = (intervalMs?: number) => startUnifiedPolling(intervalMs);
const stopJobPolling = () => {}; // Handled by stopAllPolling

// Start fast polling after an action that expects a state change
const startFastPolling = (expectedStatus?: string) => {
  adaptivePollingState.value = {
    isFastPolling: true,
    expectedStatus,
    fastPollStartTime: Date.now(),
  };

  startUnifiedPolling(pollingConfig.fast);
};

// Click outside handler to close dropdown
const handleClickOutside = (event: MouseEvent) => {
  if (
    actionsDropdown.value &&
    !actionsDropdown.value.contains(event.target as Node)
  ) {
    isActionsDropdownOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);

  // Clear any timeout from auth debouncing
  if (authTimeout) {
    clearTimeout(authTimeout);
    authTimeout = null;
  }
});

// Stop all polling when navigating away from the page
onBeforeRouteLeave(() => {
  stopAllPolling();
});

// Auto-select most recently posted job for logs display
watch(
  () => [activeTab.value, allJobs.value],
  async ([newTab, jobs]) => {
    if (newTab === "logs" && jobs && Array.isArray(jobs) && jobs.length > 0) {
      // Only auto-select if user hasn't manually selected a job
      if (!userSelectedJob.value) {
        // If no job is selected or selected job is not in current jobs list, select most recent
        if (!activeLogsJobId.value || !jobs.some(j => j.job === activeLogsJobId.value)) {
          // Sort by created_at descending (most recent first)
          const sorted = [...jobs].sort((a, b) => {
            const aTime = (a as any).created_at ? new Date((a as any).created_at).getTime() : 0;
            const bTime = (b as any).created_at ? new Date((b as any).created_at).getTime() : 0;
            return bTime - aTime;
          });
          const mostRecent = sorted[0];
          if (mostRecent) {
            await selectJobForLogs(mostRecent);
          }
        }
      }
    }
  },
  { immediate: true }
);

// Debounced authentication watcher to prevent flickering
let authTimeout: NodeJS.Timeout | null = null;

watch(
  hasAnyAuth,
  (authed) => {
    // Clear any existing timeout
    if (authTimeout) {
      clearTimeout(authTimeout);
    }

    // If authenticated, load deployment if we don't have one
    if (authed) {
      // Clear any error state
      if (
        error.value === "Please log in or connect wallet to view deployments"
      ) {
        error.value = null;
      }
      // Only load if deployment doesn't exist yet
      if (!deployment.value) {
        loadDeployment();
      }
      return;
    }

    // If not authenticated, only show error after a delay and only if we don't have a deployment
    // This prevents the error from showing during temporary auth interruptions (tab switching, session refresh)
    authTimeout = setTimeout(() => {
      if (!hasAnyAuth.value) {
        // Only show login error if we don't already have deployment data
        // This preserves the deployment during temporary auth interruptions
        if (!deployment.value) {
          error.value = "Please log in or connect wallet to view deployments";
        }
      }
    }, 2000); // 2 second delay to allow auth to re-establish
  },
  { immediate: true }
);

// Watch deployment status to automatically manage polling for running deployments
const prevDeploymentStatus = ref<string | null>(null);

watch(
  () => deployment.value?.status,
  (newStatus) => {
    if (!newStatus) return;

    const status = newStatus.toUpperCase();
    const prev = prevDeploymentStatus.value;

    // If transitioning to RUNNING, start fast polling (skip normal polling)
    if (status === "RUNNING" && prev !== "RUNNING") {
      const expectedStatus =
        prev && prev !== "STARTING" && prev !== "RUNNING" ? "RUNNING" : undefined;
      startFastPolling(expectedStatus);
    }
    // Start normal polling when deployment is active (but not if we just started fast polling)
    else if (
      (status === "STARTING" || status === "RUNNING") &&
      !pollingTimeout.value
    ) {
      startUnifiedPolling();
    }

    // Stop polling when deployment reaches a final state and no active jobs
    if (["STOPPED", "ARCHIVED", "ERROR"].includes(status) && !hasActiveJobs.value) {
      stopAllPolling();
    }

    prevDeploymentStatus.value = status;
  },
  { immediate: true }
);

// Switch tab and update URL
const switchTab = (tab: string) => {
  activeTab.value = tab;
  // Reset pagination when switching to logs tab
  if (tab === 'logs') {
    logsJobsPage.value = 1;
  }
  router.replace({
    query: {
      ...route.query,
      tab: tab === 'overview' ? undefined : tab // Don't include tab=overview in URL for cleaner URLs
    }
  });
};

// Switch action and update URL
const switchAction = (action: string) => {
  if (action === "create-revision") showRevisionModal.value = true;
  else if (action === "update-replicas") showReplicasModal.value = true;
  else if (action === "update-timeout") showTimeoutModal.value = true;
  else if (action === "update-schedule") showScheduleModal.value = true;
  else if (action === "topup" && deploymentVault.value) {
    openVaultModal(deploymentVault.value, "topup", () => updateVaultBalance(deploymentVault.value!));
  } else if (action === "withdraw" && deploymentVault.value) {
    openVaultModal(deploymentVault.value, "withdraw", () => updateVaultBalance(deploymentVault.value!));
  }

  router.replace({
    query: {
      ...route.query,
      action,
    },
  });
};

// Clear action from URL
const clearAction = () => {
  if (route.query.action) {
    const { action, ...query } = route.query;
    router.replace({ query });
  }
};

// Watch revision modal to initialize job definition and clear URL when closed
watch(
  [() => showRevisionModal.value, () => jobDefinitionModel.value],
  ([isOpen, definition]) => {
    if (isOpen && definition && !revisionJobDefinition.value) {
      revisionJobDefinition.value = JSON.parse(JSON.stringify(definition));
    }
    if (!isOpen) {
      revisionJobDefinition.value = null;
      if (route.query.action === "create-revision") {
        clearAction();
      }
    }
  }
);

// Watch other modals to clear URL when closed
watch(showReplicasModal, (isOpen) => {
  if (!isOpen && route.query.action === "update-replicas") clearAction();
});

watch(showTimeoutModal, (isOpen) => {
  if (!isOpen && route.query.action === "update-timeout") clearAction();
});

watch(showScheduleModal, (isOpen) => {
  if (!isOpen && route.query.action === "update-schedule") clearAction();
});

// Watch for vault becoming available and open modal if URL has vault action
watch(
  deploymentVault,
  (vault) => {
    const action = route.query.action?.toString();
    if (vault && (action === "topup" || action === "withdraw") && !vaultModalState.value.modalType) {
      openVaultModal(vault, action, () => updateVaultBalance(vault));
    }
  },
  { immediate: true }
);

watch(() => vaultModalState.value.modalType, (modalType) => {
  if (!modalType && (route.query.action === "topup" || route.query.action === "withdraw")) {
    clearAction();
  }
});

// Head
useHead({
  title: computed(() =>
    deployment.value
      ? `${deployment.value.name} - Deployment`
      : "Loading Deployment"
  ),
});
</script>

<style lang="scss" scoped>
// Improved header layout
.deployment-header > .is-flex {
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left-section {
  min-width: 0; // Allow text to truncate
  flex: 1;
}

.header-title-section {
  min-width: 0; // Allow text to truncate
  max-width: 400px; // Prevent extremely long names from stretching too much
  display: flex !important;
  flex-direction: column !important;
}

.header-title-section .title {
  display: block !important;
  margin-bottom: 0.25rem !important;
}

.header-title-section .subtitle {
  display: block !important;
  word-break: break-all; // Allow long IDs to wrap
  line-height: 1.2;
  margin-top: 0 !important;
}

.deployment-header .status-tag {
  white-space: nowrap;
  flex-shrink: 0;
}

// Mobile responsive
@media screen and (max-width: 768px) {
  .deployment-header > .is-flex {
    flex-direction: column !important;
    align-items: stretch !important;
    flex-wrap: nowrap !important;
  }

  .header-left-section {
    width: 100%;
    margin-bottom: 1rem;
  }

  .deployment-tabs {
    width: 100% !important;
    justify-content: flex-start;
    margin-top: 0.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .header-title-section {
    max-width: none;
  }

  .header-title-section .subtitle {
    font-size: 0.75rem;
  }

  .tab-button {
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
  }
}

// Extra small screens
@media screen and (max-width: 480px) {
  .deployment-tabs {
    gap: 0.25rem;
  }

  .tab-button {
    font-size: 0.75rem;
    padding: 0.375rem 0.5rem;
  }
}

// Responsive endpoint URLs
.endpoint-url {
  word-break: break-all;
  display: inline-block;
  max-width: 100%;
  overflow-wrap: break-word;
}

@media screen and (max-width: 768px) {
  .endpoint-url {
    font-size: 0.75rem;
    max-width: 300px;
    min-width: 200px;
  }
}

@media screen and (max-width: 480px) {
  .endpoint-url {
    font-size: 0.7rem;
    max-width: 250px;
    min-width: 180px;
  }
}

.status-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 0.4rem;
}

.status-running {
  background-color: $success;
}
.status-starting {
  background-color: $info;
}
.status-draft {
  background-color: $grey;
}
.status-stopped {
  background-color: $grey-dark;
}
.status-stopping {
  background-color: $warning;
}
.status-error {
  background-color: $danger;
}
.status-insufficient {
  background-color: $warning;
}
.status-archived {
  background-color: $grey-light;
}
.status-unknown {
  background-color: $grey-lighter;
}

.sep {
  opacity: 0.6;
}

.gap-2 {
  gap: 0.5rem;
}

.sticky-subheader {
  position: sticky;
  top: 0;
  z-index: 10;
  background: $white;
}

.dark-mode .sticky-subheader {
  background: #1a1a1a;
}

.box.is-borderless {
  padding: 0 !important;
}

.tag.is-stopped {
  background-color: $grey-lightest !important;
  border-color: $grey-lighter !important;
  color: $grey-dark !important;

  img {
    width: 12px !important;
    height: 12px !important;
  }
}

.dark-mode .tag.is-stopped {
  background-color: $grey-darker !important;
  border-color: $grey-dark !important;
  color: $grey !important;

  img {
    width: 12px !important;
    height: 12px !important;
  }
}

// Deployment-specific styling
.deployment-header {
  border-bottom: 1px solid $grey-lighter;
}

html.dark-mode .deployment-header {
  border-bottom-color: $grey-dark;
}

// Deployment logs styling
.deployment-logs-container {
  .deployment-logs-content {
    background-color: $white;
    border-radius: $radius-small;
    margin-top: 0.2rem;
  }

  .selected-job-logs {
    min-height: 25rem;
  }
}

// Dark mode support
html.dark-mode {
  .deployment-logs-container .deployment-logs-content {
    background-color: $black-ter;
  }
}
</style>

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
              <div
                v-if="hasErrorInLastEvent"
                class="notification is-danger mb-5 is-light"
              >
                <div
                  class="is-flex is-align-items-center is-justify-content-space-between"
                >
                  <div>
                    <strong>Deployment Error Detected</strong>
                    <p class="mt-1">
                      An error occurred with this deployment. View the Events
                      tab for more details.
                    </p>
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
                    <table
                      class="table is-fullwidth mb-0"
                      style="table-layout: fixed"
                    >
                      <thead>
                        <tr>
                          <th style="width: 25%">Operation</th>
                          <th style="width: 10%">Port</th>
                          <th style="width: 12%">Status</th>
                          <th style="width: 53%">URL</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="endpoint in deploymentEndpoints"
                          :key="`${endpoint.opId}-${endpoint.port}`"
                          :style="{
                            opacity:
                              deployment.status !== 'RUNNING' &&
                              deployment.status !== 'STARTING'
                                ? '0.5'
                                : '1',
                          }"
                        >
                          <td>{{ endpoint.opId }}</td>
                          <td>{{ endpoint.port }}</td>
                          <td>
                            <StatusTag
                              :status="
                                deployment.status === 'RUNNING' ||
                                deployment.status === 'STARTING'
                                  ? 'ACTIVE'
                                  : 'INACTIVE'
                              "
                            />
                          </td>
                          <td>
                            <a
                              v-if="
                                deployment.status === 'RUNNING' ||
                                deployment.status === 'STARTING'
                              "
                              :href="endpoint.url"
                              target="_blank"
                              class="has-text-link endpoint-url"
                              >{{ endpoint.url }} ↗</a
                            >
                            <span
                              v-else
                              class="has-text-grey-light"
                              style="text-decoration: line-through"
                            >
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
                      @click="
                        jobActivityTab = 'active';
                        historicalJobsPage = 1;
                      "
                      class="tab-button is-small"
                      :class="{ 'is-active': jobActivityTab === 'active' }"
                    >
                      Active
                    </button>
                    <button
                      @click="
                        jobActivityTab = 'history';
                        historicalJobsPage = 1;
                      "
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
                    v-if="
                      activeJobs.length === 0 && allHistoricalJobs.length === 0
                    "
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
                      <table
                        class="table is-fullwidth mb-0"
                        style="table-layout: fixed"
                      >
                        <thead>
                          <tr>
                            <th style="width: 25%">Name</th>
                            <th style="width: 10%">Revision</th>
                            <th style="width: 12%">Status</th>
                            <th style="width: 18%">Created on</th>
                            <th style="width: 20%">Navigation</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="job in [...activeJobs, ...allHistoricalJobs]"
                            :key="job.job"
                          >
                            <td
                              style="
                                overflow: hidden;
                                text-overflow: ellipsis;
                                white-space: nowrap;
                                max-width: 0;
                              "
                            >
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
                      <table
                        class="table is-fullwidth mb-0"
                        style="table-layout: fixed"
                      >
                        <thead>
                          <tr>
                            <th style="width: 25%">Name</th>
                            <th style="width: 10%">Revision</th>
                            <th style="width: 12%">Status</th>
                            <th style="width: 18%">Created on</th>
                            <th style="width: 20%">Navigation</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="job in activeJobs" :key="job.job">
                            <td
                              style="
                                overflow: hidden;
                                text-overflow: ellipsis;
                                white-space: nowrap;
                                max-width: 0;
                              "
                            >
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
                        <table
                          class="table is-fullwidth mb-0"
                          style="table-layout: fixed"
                        >
                          <thead>
                            <tr>
                              <th style="width: 25%">Name</th>
                              <th style="width: 10%">Revision</th>
                              <th style="width: 12%">Status</th>
                              <th style="width: 15%">Duration</th>
                              <th style="width: 18%">Created on</th>
                              <th style="width: 20%">Navigation</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="job in historicalJobs" :key="job.job">
                              <td
                                style="
                                  overflow: hidden;
                                  text-overflow: ellipsis;
                                  white-space: nowrap;
                                  max-width: 0;
                                "
                              >
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
                    <table
                      class="table is-fullwidth mb-0"
                      style="table-layout: fixed"
                    >
                      <tbody>
                        <!-- Vault Details Section -->
                        <VaultOverviewRows
                          v-if="hasVault && deploymentVault"
                          :isTableRow="true"
                          :deployment="deployment"
                        />
                        <tr>
                          <td style="width: 25%">Deployment strategy</td>
                          <td style="width: 75%">
                            {{ formatStrategy(deployment.strategy) }}
                          </td>
                        </tr>
                        <tr>
                          <td style="width: 25%">Replicas</td>
                          <td style="width: 75%">{{ deployment.replicas }}</td>
                        </tr>
                        <tr>
                          <td style="width: 25%">GPU</td>
                          <td
                            style="width: 75%"
                            v-if="deployment && deployment.market"
                          >
                            <span
                              v-if="
                                testgridMarkets &&
                                testgridMarkets.find(
                                  (tgm: any) =>
                                    tgm.address === deployment?.market,
                                )
                              "
                            >
                              {{
                                testgridMarkets.find(
                                  (tgm: any) =>
                                    tgm.address === deployment?.market,
                                ).name
                              }}
                            </span>
                            <span v-else>{{ deployment.market }}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="width: 25%">Container timeout</td>
                          <td style="width: 75%">
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
                          <td style="width: 25%">Schedule</td>
                          <td style="width: 75%">
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
                          <td style="width: 25%">Created on</td>
                          <td style="width: 75%">
                            {{ formatDate(deployment.created_at) }}
                          </td>
                        </tr>
                        <tr>
                          <td style="width: 25%">Last updated on</td>
                          <td style="width: 75%">
                            {{ formatDate(deployment.updated_at) }}
                          </td>
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
                          v-for="(task, index) in tasks"
                          :key="
                            task.deploymentId
                              ? `${task.deploymentId}-${task.created_at}`
                              : `task-${index}`
                          "
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
                    <span
                      v-if="getJobStateNumber(job) === 2"
                      class="ml-2 is-size-7 has-text-grey"
                      >(completed)</span
                    >
                  </button>
                </div>

                <!-- Selected Job Logs -->
                <div
                  v-if="activeLogsJobId && deployment"
                  class="selected-job-logs"
                >
                  <!-- Show logs for active jobs -->
                  <div v-if="isActiveJob(activeLogsJobId)">
                    <JobLogsContainer
                      :job-id="activeLogsJobId"
                      :deployment-id="deployment.id"
                    />
                  </div>
                  <!-- Show results for completed jobs -->
                  <div
                    v-else-if="isCompletedJob(activeLogsJobId)"
                    class="completed-job-results"
                  >
                    <div
                      v-if="loadingJobResults[activeLogsJobId]"
                      class="has-text-centered p-4"
                    >
                      <p class="has-text-grey">Loading results...</p>
                    </div>
                    <div
                      v-else-if="
                        completedJobResults[activeLogsJobId] &&
                        getJobData(activeLogsJobId)
                      "
                    >
                      <JobResult
                        :ipfs-result="completedJobResults[activeLogsJobId]!"
                        :ipfs-job="getJobData(activeLogsJobId)!"
                      />
                    </div>
                    <div v-else-if="!loadingJobResults[activeLogsJobId]">
                      <JobResult
                        :ipfs-result="null"
                        :ipfs-job="getJobData(activeLogsJobId) || null"
                      />
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
                  v-if="deploymentRevisions && deploymentRevisions.length > 0"
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
import type { JobDefinition } from "@nosana/kit";
import { useVaultModal } from "~/composables/useVaultModal";
import { updateVaultBalance } from "~/composables/useDeploymentVault";
import { useWallet } from "@nosana/solana-vue";
import { useSuperTokens } from "~/composables/useSuperTokens";
import { useDeploymentDetail } from "~/composables/useDeploymentDetail";
import { useDeploymentJobs } from "~/composables/useDeploymentJobs";
import { useDeploymentActions } from "~/composables/useDeploymentActions";
import { useDeploymentPolling } from "~/composables/useDeploymentPolling";
import { useDeploymentJobDefinition } from "~/composables/useDeploymentJobDefinition";
import JobStatus from "~/components/Job/Status.vue";
import JobLogsContainer from "~/components/Job/LogsContainer.vue";
import JobResult from "~/components/Job/Result.vue";
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
import { parseCronExpression } from "~/utils/parseCronExpression";

const colorMode = useColorMode();

// --- Auth setup ---
const route = useRoute();
const router = useRouter();
const { open: openVaultModal, state: vaultModalState } = useVaultModal();
const { isAuthenticated: superTokensAuth } = useSuperTokens();
const { connected, account } = useWallet();

const isAuthenticated = computed(() => superTokensAuth.value);
const isWalletMode = computed(
  () => connected.value && account.value?.address && !superTokensAuth.value,
);
const hasAnyAuth = computed(() => isAuthenticated.value || isWalletMode.value);

// --- Tab state ---
const activeTab = ref("overview");
const availableTabs = computed(() => {
  return ["overview", "logs", "events", "configuration"];
});

// Initialize activeTab from URL query parameter
const initialTab = route.query.tab?.toString();
if (
  initialTab &&
  ["overview", "logs", "events", "configuration"].includes(initialTab)
) {
  activeTab.value = initialTab;
}

// --- Composables ---
const detail = useDeploymentDetail({
  hasAnyAuth,
  isWalletMode,
  activeTab,
});

const {
  deployment,
  loading,
  error,
  deploymentJobs,
  deploymentEventsData,
  deploymentRevisions,
  tasks,
  jobsLoading,
  eventsLoading,
  revisionsLoading,
  tasksLoading,
  jobStates,
  allJobsData,
  jobStateStringToNumber,
  deploymentStatus,
  hasVault,
  deploymentVault,
  deploymentSchedule,
  hasActiveJobs,
  loadDeployment,
  loadJobs,
  loadEvents,
  loadRevisions,
  loadTasks,
} = detail;

const jobs = useDeploymentJobs({
  deployment,
  deploymentJobs,
  deploymentEventsData,
  jobStates,
  allJobsData,
  jobStateStringToNumber,
});

const {
  activeJobsPage,
  historicalJobsPage,
  logsJobsPage,
  activeLogsJobId,
  userSelectedJob,
  jobActivityTab,
  completedJobResults,
  loadingJobResults,
  getJobDuration,
  getJobStateNumber,
  activeJobs,
  allHistoricalJobs,
  historicalJobs,
  historicalJobsTotalPages,
  totalJobs,
  allJobsForLogs,
  allJobs,
  logsJobsTotalPages,
  isActiveJob,
  isCompletedJob,
  getJobData,
  selectJobForLogs,
  deploymentEndpoints,
  deploymentEvents,
  hasErrorInLastEvent,
} = jobs;

const polling = useDeploymentPolling({
  deployment,
  activeTab,
  hasActiveJobs,
  loadDeployment,
  loadJobs,
  loadEvents,
  loadTasks,
});

const {
  pollingTimeout,
  stopAllPolling,
  startUnifiedPolling,
  startFastPolling,
  stopJobPolling,
} = polling;

const actions = useDeploymentActions({
  deployment,
  hasAnyAuth,
  isWalletMode,
  deploymentStatus,
  hasActiveJobs,
  loadDeployment,
  startFastPolling,
  stopJobPolling,
});

const {
  actionLoading,
  showReplicasModal,
  showTimeoutModal,
  showScheduleModal,
  showRevisionModal,
  showRevisionDefinitionModal,
  newReplicaCount,
  newTimeoutHours,
  newSchedule,
  revisionJobDefinition,
  switchingRevision,
  viewingRevision,
  canStart,
  canStop,
  canArchive,
  hasAnyActions,
  startDeployment,
  stopDeployment,
  archiveDeployment,
  updateReplicas,
  updateJobTimeout,
  updateSchedule,
  createRevision,
  switchToRevision,
  viewRevisionDefinition,
  isValidCronExpression,
} = actions;

const jobDef = useDeploymentJobDefinition({
  deployment,
  deploymentRevisions,
  actionLoading,
  loadDeployment,
});

const {
  jobDefinitionModel,
  loadingJobDefinition,
  currentJobDefEditor,
  revisionJobDefEditor,
  canSaveRevision,
  loadJobDefinition,
  hasDefinitionChanged,
  resetDefinition,
  makeRevision,
} = jobDef;

// Wire up the circular dependency: loadDeployment needs loadJobDefinition
detail.setLoadJobDefinition(loadJobDefinition);

// --- Remaining page-level state ---
const isActionsDropdownOpen = ref(false);
const actionsDropdown = ref<HTMLElement | null>(null);
const headerIconRef = ref<HTMLElement | null>(null);
const { data: testgridMarkets } = useAPI("/api/markets", { default: () => [] });

// Available actions for URL-based modal opening
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
}

// --- Formatters ---
const sortedRevisions = computed(() => {
  return deploymentRevisions.value || [];
});

const formatDate = (dateString: string | Date) => {
  return new Date(dateString).toLocaleString();
};

const formatStrategy = (strategy: string | undefined | null): string => {
  if (!strategy) return "-";
  return strategy.toLowerCase().replace(/-/g, " ");
};

// --- Debug instrumentation ---
const attachSmilDebugListeners = (svgEl: SVGElement, _label: string) => {
  try {
    const animations = svgEl.querySelectorAll("animateTransform");
    animations.forEach((anim: any) => {
      if (anim.__dbg) return;
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
    `dep=${deployment.value.id} status=${deployment.value.status}`,
  );
};

// --- Auto-start DRAFT deployments ---
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
  { immediate: true },
);

watch(
  () => deployment.value?.status,
  () => nextTick(instrumentHeaderIcon),
  { immediate: true },
);

// --- Click outside handler ---
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

// --- Auth timeout cleanup ---
let authTimeout: NodeJS.Timeout | null = null;

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  if (authTimeout) {
    clearTimeout(authTimeout);
    authTimeout = null;
  }
});

onBeforeRouteLeave(() => {
  stopAllPolling();
});

// --- Watchers ---

// Auto-select most recently posted job for logs display
watch(
  () => [activeTab.value, allJobs.value],
  async ([newTab, jobsList]) => {
    if (
      newTab === "logs" &&
      jobsList &&
      Array.isArray(jobsList) &&
      jobsList.length > 0
    ) {
      if (!userSelectedJob.value) {
        if (
          !activeLogsJobId.value ||
          !jobsList.some((j) => j.job === activeLogsJobId.value)
        ) {
          const sorted = [...jobsList].sort((a, b) => {
            const aTime = (a as any).created_at
              ? new Date((a as any).created_at).getTime()
              : 0;
            const bTime = (b as any).created_at
              ? new Date((b as any).created_at).getTime()
              : 0;
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
  { immediate: true },
);

// Debounced authentication watcher
watch(
  hasAnyAuth,
  (authed) => {
    if (authTimeout) {
      clearTimeout(authTimeout);
    }

    if (authed) {
      if (
        error.value === "Please log in or connect wallet to view deployments"
      ) {
        error.value = null;
      }
      if (!deployment.value) {
        loadDeployment();
      }
      return;
    }

    authTimeout = setTimeout(() => {
      if (!hasAnyAuth.value) {
        if (!deployment.value) {
          error.value = "Please log in or connect wallet to view deployments";
        }
      }
    }, 2000);
  },
  { immediate: true },
);

// Watch deployment status to manage polling
const prevDeploymentStatus = ref<string | null>(null);

watch(
  () => deployment.value?.status,
  (newStatus) => {
    if (!newStatus) return;

    const status = newStatus.toUpperCase();
    const prev = prevDeploymentStatus.value;

    if (status === "RUNNING" && prev !== "RUNNING") {
      const expectedStatus =
        prev && prev !== "STARTING" && prev !== "RUNNING"
          ? "RUNNING"
          : undefined;
      startFastPolling(expectedStatus);
    } else if (
      (status === "STARTING" || status === "RUNNING") &&
      !pollingTimeout.value
    ) {
      startUnifiedPolling();
    }

    if (
      ["STOPPED", "ARCHIVED", "ERROR"].includes(status) &&
      !hasActiveJobs.value
    ) {
      stopAllPolling();
    }

    prevDeploymentStatus.value = status;
  },
  { immediate: true },
);

// --- Tab & action URL sync ---
const switchTab = (tab: string) => {
  activeTab.value = tab;
  if (tab === "logs") {
    logsJobsPage.value = 1;
  }
  if (tab === "events") {
    loadEvents(true);
    loadTasks(true);
  }
  router.replace({
    query: {
      ...route.query,
      tab: tab === "overview" ? undefined : tab,
    },
  });
};

const switchAction = (action: string) => {
  if (action === "create-revision") showRevisionModal.value = true;
  else if (action === "update-replicas") showReplicasModal.value = true;
  else if (action === "update-timeout") showTimeoutModal.value = true;
  else if (action === "update-schedule") showScheduleModal.value = true;
  else if (action === "topup" && deploymentVault.value) {
    openVaultModal(deploymentVault.value, "topup", () =>
      updateVaultBalance(deploymentVault.value!),
    );
  } else if (action === "withdraw" && deploymentVault.value) {
    openVaultModal(deploymentVault.value, "withdraw", () =>
      updateVaultBalance(deploymentVault.value!),
    );
  }

  router.replace({
    query: {
      ...route.query,
      action,
    },
  });
};

const clearAction = () => {
  if (route.query.action) {
    const { action, ...query } = route.query;
    router.replace({ query });
  }
};

// --- Modal watchers ---
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
  },
);

watch(showReplicasModal, (isOpen) => {
  if (!isOpen && route.query.action === "update-replicas") clearAction();
});

watch(showTimeoutModal, (isOpen) => {
  if (!isOpen && route.query.action === "update-timeout") clearAction();
});

watch(showScheduleModal, (isOpen) => {
  if (!isOpen && route.query.action === "update-schedule") clearAction();
});

watch(
  deploymentVault,
  (vault) => {
    const action = route.query.action?.toString();
    if (
      vault &&
      (action === "topup" || action === "withdraw") &&
      !vaultModalState.value.modalType
    ) {
      openVaultModal(vault, action, () => updateVaultBalance(vault));
    }
  },
  { immediate: true },
);

watch(
  () => vaultModalState.value.modalType,
  (modalType) => {
    if (
      !modalType &&
      (route.query.action === "topup" || route.query.action === "withdraw")
    ) {
      clearAction();
    }
  },
);

// Head
useHead({
  title: computed(() =>
    deployment.value
      ? `${deployment.value.name} - Deployment`
      : "Loading Deployment",
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

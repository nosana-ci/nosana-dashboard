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
          <div class="is-flex is-justify-content-space-between is-align-items-start">
            <div class="header-left-section">
              <div class="is-flex is-align-items-center mb-2">
                <NuxtLink :to="backLink" class="button is-ghost back-button mr-4">
                  <span class="icon is-small">
                    <ArrowUpIcon class="icon-16 transform-rotate-270" style="color: black;" />
                  </span>
                </NuxtLink>
                <div class="header-title-section">
                  <h1 class="title is-5 has-text-weight-normal mb-1">{{ deployment.name || 'Deployment' }}</h1>
                  <p v-if="deployment.name" class="subtitle is-7 has-text-grey is-family-monospace mb-0">{{ deployment.id }}</p>
                </div>
                <StatusTag class="ml-4" :status="deployment.status" />
              </div>
            </div>
            <div class="deployment-tabs">
              <button 
                v-for="tab in ['overview', 'logs', 'events', 'job-definition']"
                :key="tab"
                @click="activeTab = tab"
                :class="{ 'is-active': activeTab === tab }"
                class="tab-button"
              >
                {{ tab === 'job-definition' ? 'Definition' : tab.charAt(0).toUpperCase() + tab.slice(1) }}
              </button>
              <!-- Actions Dropdown -->
              <div class="dropdown is-right" :class="{ 'is-active': isActionsDropdownOpen }" ref="actionsDropdown">
                <div class="dropdown-trigger">
                  <button 
                    class="tab-button actions-button" 
                    @click="isActionsDropdownOpen = !isActionsDropdownOpen"
                    :class="{ 'is-loading': actionLoading }"
                  >
                    <span>Actions</span>
                    <span class="icon is-small dropdown-arrow ml-1" :class="{ 'is-rotated': isActionsDropdownOpen }">
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
                      @click="startDeployment(); isActionsDropdownOpen = false"
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
                      @click="stopDeployment(); isActionsDropdownOpen = false"
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
                      @click="archiveDeployment(); isActionsDropdownOpen = false"
                      :disabled="actionLoading"
                    >
                      <span class="icon is-small mr-2">
                        <ArchiveIcon />
                      </span>
                      <span>Archive</span>
                    </a>

                    <hr class="dropdown-divider" v-if="(canStart || canStop || canArchive) && deployment.status !== 'ARCHIVED'">

                    <!-- Update Replicas Action -->
                    <a 
                      v-if="deployment.status !== 'ARCHIVED'"
                      class="dropdown-item"
                      @click="showReplicasModal = true; isActionsDropdownOpen = false"
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
                      @click="showTimeoutModal = true; isActionsDropdownOpen = false"
                      :disabled="actionLoading"
                    >
                      <span class="icon is-small mr-2">
                        <ClockIcon />
                      </span>
                      <span>Update Timeout</span>
                    </a>

                    <!-- Update Schedule Action (only for scheduled deployments) -->
                    <a 
                      v-if="deployment.status !== 'ARCHIVED' && deployment.strategy?.toUpperCase() === 'SCHEDULED'"
                      class="dropdown-item"
                      @click="showScheduleModal = true; isActionsDropdownOpen = false"
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
                      @click="showRevisionModal = true; isActionsDropdownOpen = false"
                      :disabled="actionLoading"
                    >
                      <span class="icon is-small mr-2">
                        <EditIcon />
                      </span>
                      <span>Create Revision</span>
                    </a>

                    <div v-if="!hasAnyActions" class="dropdown-item has-text-grey">
                      <span>No actions available</span>
                    </div>
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
          
          <!-- Deployment Details Section -->
          <div class="mb-5">
            <h2 class="title is-5 mb-3">Deployment details</h2>
            <div class="box is-borderless">
              <div class="table-container">
                <table class="table is-fullwidth mb-0">
                <tbody>
                  <tr>
                    <td class="has-min-width-250">Deployment strategy</td>
                    <td>{{ deployment.strategy }}</td>
                  </tr>
                  <tr>
                    <td>Replicas count</td>
                    <td>{{ deployment.replicas }}</td>
                  </tr>
                  <tr>
                    <td>GPU</td>
                    <td v-if="deployment && deployment.market">
                      <span
                        v-if="testgridMarkets &&
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
                    <td>Container timeout</td>
                    <td>{{ Math.floor(deployment.timeout / 60) }} hours</td>
                  </tr>
                  
                  <!-- Scheduled deployment cron schedule -->
                  <tr v-if="deployment.strategy?.toUpperCase() === 'SCHEDULED' && deployment.schedule">
                    <td>Schedule</td>
                    <td>
                      <div class="is-flex is-flex-direction-column">
                        <span class="is-family-monospace">{{ deployment.schedule }}</span>
                        <span class="is-size-7 has-text-grey mt-1">{{ parseCronExpression(deployment.schedule) }}</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Created on</td>
                    <td>{{ formatDate(deployment.created_at) }}</td>
                  </tr>
                  <tr>
                    <td>Last updated on</td>
                    <td>{{ formatDate(deployment.updated_at) }}</td>
                  </tr>
                </tbody>
              </table>
              </div>
            </div>
          </div>

          <!-- Endpoints Section -->
          <div v-if="deploymentEndpoints.length > 0" class="mb-5">
            <h2 class="title is-5 mb-3">Endpoints</h2>
            <div class="box is-borderless">
              <div class="table-container">
                <table class="table is-fullwidth mb-0">
                <thead>
                  <tr>
                    <th>Operation</th>
                    <th>Port</th>
                    <th>URL</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="endpoint in deploymentEndpoints" :key="`${endpoint.opId}-${endpoint.port}`">
                    <td>{{ endpoint.opId }}</td>
                    <td>{{ endpoint.port }}</td>
                    <td>
                      <a :href="endpoint.url" target="_blank" class="has-text-link endpoint-url">{{ endpoint.url }} ↗</a>
                    </td>
                    <td>
                      <StatusTag :status="endpoint.status" />
                    </td>
                  </tr>
                </tbody>
              </table>
              </div>
            </div>
          </div>

          <!-- Job Activity Section -->
          <div>
            <h2 class="title is-5 mb-3">Job activity</h2>
            
            <!-- Job Activity Tabs -->
            <div class="deployment-tabs mb-3 ml-4">
              <button 
                @click="jobActivityTab = 'running'"
                class="tab-button"
                :class="{ 'is-active': jobActivityTab === 'running' }"
              >
                Running
              </button>
              <button 
                @click="jobActivityTab = 'history'"
                class="tab-button"
                :class="{ 'is-active': jobActivityTab === 'history' }"
              >
                History
              </button>
            </div>
            
            <!-- Running Jobs -->
            <div v-if="jobActivityTab === 'running'">
              <div v-if="activeJobs.length === 0" class="box has-text-centered p-6">
                <p class="has-text-grey">
                  <span v-if="deployment.status === 'DRAFT'">Start deployment to create jobs</span>
                  <span v-else>No running jobs</span>
                </p>
              </div>
              
              <div v-else class="box is-borderless">
                <div class="table-container">
                  <table class="table is-fullwidth mb-0">
                  <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Created on</th>
                    <th></th>
                  </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="job in activeJobs"
                      :key="job.job"
                    >
                      <td>
                        <span class="is-family-monospace is-size-7">{{ job.job }}</span>
                      </td>
                      <td>
                        <JobStatus :status="job.state || 0" />
                      </td>
                      <td>{{ formatDate(job.created_at) }}</td>
                      <td>
                        <NuxtLink
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
              <div v-if="historicalJobs.length === 0" class="box has-text-centered p-6">
                <p class="has-text-grey">No completed jobs yet</p>
              </div>
              
              <div v-else class="box is-borderless">
                <div class="table-container">
                  <table class="table is-fullwidth mb-0">
                  <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Created on</th>
                    <th></th>
                  </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="job in historicalJobs"
                      :key="job.job"
                    >
                      <td>
                        <span class="is-family-monospace is-size-7">{{ job.job }}</span>
                      </td>
                      <td>
                        <JobStatus :status="job.state || 0" />
                      </td>
                      <td>{{ formatDate(job.created_at) }}</td>
                      <td>
                        <NuxtLink
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
          </div>
        </div>

        <!-- Events Tab -->
        <div v-if="activeTab === 'events'">
          <!-- Upcoming Tasks -->
          <div class="mb-5">
            <div class="is-flex is-justify-content-space-between is-align-items-center mb-3">
              <h2 class="title is-5 mb-0">Upcoming Tasks <span class="tag is-light">{{ tasks.length }}</span></h2>
              <button 
                class="button is-small" 
                @click="loadTasks"
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
                    <td colspan="5" class="has-text-centered has-text-grey py-6">
                      No tasks yet
                    </td>
                  </tr>
                  <tr v-else-if="tasksLoading">
                    <td colspan="5" class="has-text-centered has-text-grey py-6">
                      <span class="icon is-small mr-2">
                        <i class="fas fa-spinner fa-spin"></i>
                      </span>
                      Loading tasks...
                    </td>
                  </tr>
                  <tr v-else v-for="task in tasks" :key="task.deploymentId + task.created_at">
                    <td>
                      <StatusTag status="QUEUED" />
                    </td>
                    <td>
                      <span class="tag is-light is-small">{{ task.task }}</span>
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
            <h2 class="title is-5 mb-3">History <span class="tag is-light">{{ deploymentEvents.length }}</span></h2>
            
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
                    <td colspan="5" class="has-text-centered has-text-grey py-6">
                      No events yet
                    </td>
                  </tr>
                  <tr v-else v-for="(event, index) in deploymentEvents" :key="index">
                    <td>
                      <span class="tag is-light is-small">{{ event.type }}</span>
                    </td>
                    <td>
                      <span class="tag is-light is-small">{{ event.category }}</span>
                    </td>
                    <td>
                      <span :class="{ 'is-family-monospace': event.message.length > 200 }">
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
          <div v-if="activeJobs.length === 0" class="notification is-light has-text-centered">
            <p class="has-text-grey">No running jobs to show logs for</p>
          </div>
          <div v-else class="deployment-logs-content">
            <!-- Job Tabs -->
            <div class="deployment-tabs mb-3">
              <button 
                v-for="job in activeJobs" 
                :key="job.job"
                @click="activeLogsJobId = job.job"
                :class="{ 'is-active': activeLogsJobId === job.job }"
                class="tab-button"
              >
                {{ job.job.slice(0, 16) }}...
              </button>
            </div>
            
            <!-- Selected Job Logs -->
            <div v-if="activeLogsJobId" class="selected-job-logs">
              <JobLogsContainer :job-id="activeLogsJobId" />
            </div>
          </div>
        </div>

        <!-- Job Definition Tab -->
        <div v-if="activeTab === 'job-definition'">
          <!-- Current Job Definition Section -->
          <div class="mb-5">
            <h2 class="title is-5 mb-3">Current Job Definition</h2>
            <div class="box is-borderless">
              <div v-if="loadingJobDefinition" class="has-text-grey has-text-centered py-4">
                Loading job definition...
              </div>
              <div v-else-if="jobDefinitionModel">
                <JsonEditorVue
                  :validator="validator"
                  v-model="jobDefinitionModel"
                  :mode="Mode.text"
                  :mainMenuBar="false"
                  :statusBar="false"
                  :stringified="false"
                  :readOnly="true"
                  class="job-definition-editor"
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
            <div v-if="deployment?.revisions && deployment.revisions.length > 0" class="box is-borderless">
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
                  <tr v-for="revision in sortedRevisions" :key="revision.revision">
                    <td>
                      <span class="has-text-weight-semibold">{{ revision.revision }}</span>
                    </td>
                    <td>
                      <StatusTag 
                        :status="revision.revision === deployment.active_revision ? 'ACTIVE' : 'INACTIVE'"
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
                          v-if="revision.revision !== deployment.active_revision"
                          @click="switchToRevision(revision.revision)"
                          class="button is-primary is-small"
                          :class="{ 'is-loading': switchingRevision === revision.revision }"
                          :disabled="actionLoading || switchingRevision !== null"
                        >
                          Make Active
                        </button>
                        <button 
                          @click="viewRevisionDefinition(revision)"
                          class="button is-light is-small"
                        >
                          View Definition
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
              <p class="has-text-grey is-size-7 mt-2">Create a new revision using the Actions menu.</p>
            </div>
          </div>
        </div>

        </div>
      </div>
    </div>

    <!-- Update Replicas Modal -->
    <div v-if="deployment" class="modal" :class="{ 'is-active': showReplicasModal }">
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
              <span class="icon is-small has-tooltip-arrow has-tooltip-right" data-tooltip="Number of parallel job instances">
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
          <button class="button" @click="showReplicasModal = false">Cancel</button>
          <button 
            class="button is-success"
            @click="updateReplicas(); showReplicasModal = false"
            :class="{ 'is-loading': actionLoading }"
            :disabled="actionLoading || !newReplicaCount || newReplicaCount < 1"
          >
            Update
          </button>
        </footer>
      </div>
    </div>

    <!-- Update Timeout Modal -->
    <div v-if="deployment" class="modal" :class="{ 'is-active': showTimeoutModal }">
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
              <span class="icon is-small has-tooltip-arrow has-tooltip-right" data-tooltip="Maximum runtime before auto-shutdown">
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
            <p class="help">Current: {{ (deployment.timeout / 60).toFixed(2) }}h</p>
          </div>
        </section>
        <footer class="modal-card-foot is-justify-content-flex-end">
          <button class="button" @click="showTimeoutModal = false">Cancel</button>
          <button 
            class="button is-success"
            @click="updateJobTimeout(); showTimeoutModal = false"
            :class="{ 'is-loading': actionLoading }"
            :disabled="actionLoading || !newTimeoutHours || newTimeoutHours < 0.0167"
          >
            Update
          </button>
        </footer>
      </div>
    </div>

    <!-- Update Schedule Modal -->
    <div v-if="deployment" class="modal" :class="{ 'is-active': showScheduleModal }">
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
              <span class="icon is-small has-tooltip-arrow" data-tooltip="Cron expression defining when jobs should run. Format: minute hour day month day-of-week">
                <InfoCircleIcon />
              </span>
            </label>
            <div class="control">
              <input
                type="text"
                class="input is-family-monospace"
                v-model="newSchedule"
                :placeholder="deployment.schedule || '0 * * * *'"
              />
            </div>
            <p class="help">
              <span>Current: <span class="is-family-monospace has-text-dark">{{ deployment.schedule }}</span></span><br>
              <span class="has-text-grey">{{ deployment.schedule ? parseCronExpression(deployment.schedule) : '' }}</span>
            </p>
            <div v-if="newSchedule" class="mt-3">
              <p class="help">
                <span>Preview: <span class="is-family-monospace has-text-dark">{{ newSchedule }}</span></span><br>
                <span class="has-text-grey">{{ parseCronExpression(newSchedule) }}</span>
              </p>
            </div>
          </div>
          
          <div class="content">
            <p class="has-text-grey is-size-7 mb-2"><strong>Common examples:</strong></p>
            <div class="tags">
              <span class="tag is-light is-clickable" @click="newSchedule = '0 * * * *'">
                <span class="is-family-monospace mr-1 has-text-dark">0 * * * *</span> Every hour
              </span>
              <span class="tag is-light is-clickable" @click="newSchedule = '*/30 * * * *'">
                <span class="is-family-monospace mr-1 has-text-dark">*/30 * * * *</span> Every 30 min
              </span>
              <span class="tag is-light is-clickable" @click="newSchedule = '0 0 * * *'">
                <span class="is-family-monospace mr-1 has-text-dark">0 0 * * *</span> Daily
              </span>
              <span class="tag is-light is-clickable" @click="newSchedule = '0 0 * * 0'">
                <span class="is-family-monospace mr-1 has-text-dark">0 0 * * 0</span> Weekly
              </span>
            </div>
          </div>
        </section>
        <footer class="modal-card-foot is-justify-content-flex-end">
          <button class="button" @click="showScheduleModal = false">Cancel</button>
          <button 
            class="button is-success"
            @click="updateSchedule(); showScheduleModal = false"
            :class="{ 'is-loading': actionLoading }"
            :disabled="actionLoading || !newSchedule || !isValidCronExpression(newSchedule)"
          >
            Update
          </button>
        </footer>
      </div>
    </div>

    <!-- Create Revision Modal -->
    <div v-if="deployment" class="modal" :class="{ 'is-active': showRevisionModal }">
      <div class="modal-background" @click="showRevisionModal = false"></div>
      <div class="modal-card modal-card-wide">
        <header class="modal-card-head">
          <p class="modal-card-title">Create New Revision</p>
          <button class="delete" @click="showRevisionModal = false"></button>
        </header>
        <section class="modal-card-body has-min-height-500">
          <div class="field full-height">
            <div class="control full-height">
              <JsonEditorVue 
                :validator="validator" 
                :class="{ 'jse-theme-dark': $colorMode.value === 'dark' }" 
                v-model="revisionJobDefinition" 
                :mode="Mode.text" 
                :mainMenuBar="false" 
                :statusBar="false" 
                :stringified="false" 
class="has-height-500" 
              />
            </div>
          </div>
        </section>
        <footer class="modal-card-foot is-justify-content-flex-end">
          <button class="button" @click="showRevisionModal = false">Cancel</button>
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
    <div v-if="viewingRevision" class="modal" :class="{ 'is-active': showRevisionDefinitionModal }">
      <div class="modal-background" @click="showRevisionDefinitionModal = false"></div>
      <div class="modal-card modal-card-wide">
        <header class="modal-card-head">
          <p class="modal-card-title">Revision {{ viewingRevision.revision }} - Job Definition</p>
          <button class="delete" @click="showRevisionDefinitionModal = false"></button>
        </header>
        <section class="modal-card-body has-min-height-500">
          <div v-if="viewingRevision.job_definition">
            <JsonEditorVue
              :validator="validator"
              v-model="viewingRevision.job_definition"
              :mode="Mode.text"
              :mainMenuBar="false"
              :statusBar="false"
              :stringified="false"
              :readOnly="true"
              class="job-definition-editor"
            />
          </div>
          <div v-else class="has-text-grey has-text-centered py-4">
            No job definition found for this revision
          </div>
        </section>
        <footer class="modal-card-foot is-justify-content-flex-end">
          <button class="button" @click="showRevisionDefinitionModal = false">Close</button>
        </footer>
      </div>
    </div>
    </template>
  </div>

  
</template>

<script setup lang="ts">
import type { Deployment, JobDefinition } from "@nosana/sdk";
import { Mode, ValidationSeverity } from "vanilla-jsoneditor";
import JsonEditorVue from "json-editor-vue";
import { useToast } from "vue-toastification";
import JobStatus from "~/components/Job/Status.vue";
import JobLogsContainer from "~/components/Job/LogsContainer.vue";
import { useJob } from "~/composables/jobs/useJob";
import StatusTag from "~/components/Common/StatusTag.vue";

// Import icons as components
import ArrowUpIcon from '@/assets/img/icons/arrow-up.svg?component';
import ChevronDownIcon from '@/assets/img/icons/chevron-down.svg?component';
import PlayIcon from '@/assets/img/icons/play.svg?component';
import SquareIcon from '@/assets/img/icons/square.svg?component';
import ArchiveIcon from '@/assets/img/icons/archive.svg?component';
import GridIcon from '@/assets/img/icons/grid.svg?component';
import ClockIcon from '@/assets/img/icons/clock.svg?component';
import CalendarIcon from '@/assets/img/icons/calendar.svg?component';
import EditIcon from '@/assets/img/icons/edit.svg?component';
import RefreshIcon from '@/assets/img/icons/refresh.svg?component';
import InfoCircleIcon from '@/assets/img/icons/info-circle.svg?component';
import RunningIcon from '@/assets/img/icons/status/running.svg?component';
import StoppedIcon from '@/assets/img/icons/status/stopped.svg?component';
import FailedIcon from '@/assets/img/icons/status/failed.svg?component';
import QueuedIcon from '@/assets/img/icons/status/queued.svg?component';
import DoneIcon from '@/assets/img/icons/status/done.svg?component';
import { useStatus } from '~/composables/useStatus';

// Types
interface DeploymentJob {
  job: string;
  tx: string;
  created_at: string;
  state?: number;
  market?: string;
}

interface ExtendedDeployment extends Deployment {
  schedule?: string;
}

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
const { status, token } = useAuth();
const isAuthenticated = computed(() => status.value === 'authenticated' && token.value)
const { getIpfs } = useIpfs();

// State
const deployment = ref<ExtendedDeployment | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const activeTab = ref("overview");
const activeLogsJobId = ref<string | null>(null);
const jobActivityTab = ref("running");
const actionLoading = ref(false);
const newReplicaCount = ref<number | null>(null);
const newTimeoutHours = ref<number | null>(null);
const newSchedule = ref<string>('');
const authHeader = ref<string>('');
const showTopupModal = ref(false);
const userNosBalance = ref<number>(0);
const userSolBalance = ref<number>(0);
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
// Debug instrumentation for page header icon
const headerIconRef = ref<HTMLElement | null>(null);
const { data: testgridMarkets } = useAPI("/api/markets");

// Back link logic - return to origin (account or deployments)
const backLink = computed(() => {
  const from = (useRoute().query.from as string) || '';
  return from === 'account' ? '/account/deployer' : '/deployments';
});

// Use API-provided deployment.status as-is for display

const attachSmilDebugListeners = (svgEl: SVGElement, label: string) => {
  try {
    const animations = svgEl.querySelectorAll('animateTransform');
    animations.forEach((anim: any) => {
      if (anim.__dbg) return;
      // attach to initialise timeline without logging
      anim.addEventListener('beginEvent', () => {});
      anim.addEventListener('repeatEvent', () => {});
      anim.addEventListener('endEvent', () => {});
      anim.__dbg = true;
    });
  } catch {}
};

const instrumentHeaderIcon = () => {
  const svg = headerIconRef.value?.querySelector('svg') as SVGElement | null;
  if (!svg || !deployment.value) return;
  attachSmilDebugListeners(svg, `dep=${deployment.value.id} status=${deployment.value.status}`);
};

watch(() => deployment.value?.status, () => nextTick(instrumentHeaderIcon), { immediate: true });
const statusPollingInterval = ref<NodeJS.Timeout | null>(null);
const jobPollingInterval = ref<NodeJS.Timeout | null>(null);
// Status dot helper
const statusDotClass = computed(() => {
  switch (deployment.value?.status?.toUpperCase()) {
    case 'RUNNING':
      return 'status-running';
    case 'ERROR':
      return 'status-error';
    case 'STOPPED':
      return 'status-stopped';
    case 'DRAFT':
      return 'status-draft';
    case 'STARTING':
      return 'status-starting';
    case 'STOPPING':
      return 'status-stopping';
    case 'INSUFFICIENT_FUNDS':
      return 'status-insufficient';
    case 'ARCHIVED':
      return 'status-archived';
    default:
      return 'status-unknown';
  }
});

// Computed properties for revisions
const sortedRevisions = computed(() => {
  if (!deployment.value?.revisions) return [];
  return [...deployment.value.revisions].sort((a, b) => b.revision - a.revision);
});

// Methods
// Use global status system for deployment statuses
const { getStatusClass: statusClass } = useStatus();

const getStatusIcon = (status: string) => {
  switch (status?.toUpperCase()) {
    case "RUNNING":
    case "STARTING":
      return RunningIcon;
    case "STOPPED":
    case "STOPPING":
      return StoppedIcon;
    case "ERROR":
    case "INSUFFICIENT_FUNDS":
      return FailedIcon;
    case "DRAFT":
      return QueuedIcon;
    default:
      return StoppedIcon;
  }
};

const parseCronExpression = (cronExpression: string): string => {
  if (!cronExpression) return 'Invalid cron expression';
  
  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length !== 5) return 'Invalid cron expression format';
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  try {
    // Handle some common patterns
    if (cronExpression === '0 * * * *') {
      return 'Every hour at minute 0';
    }
    if (cronExpression === '1 * * * *') {
      return 'Every hour at minute 1';
    }
    if (cronExpression === '30 * * * *') {
      return 'Every hour at minute 30';
    }
    if (cronExpression === '*/5 * * * *') {
      return 'Every 5 minutes';
    }
    if (cronExpression === '0 0 * * *') {
      return 'Daily at midnight';
    }
    if (cronExpression === '0 12 * * *') {
      return 'Daily at noon';
    }
    if (cronExpression === '0 0 * * 0') {
      return 'Weekly on Sunday at midnight';
    }
    if (cronExpression === '0 0 1 * *') {
      return 'Monthly on the 1st at midnight';
    }
    
    // Build description from parts
    let description = '';
    
    // Handle minute
    if (minute === '*') {
      description += 'Every minute';
    } else if (minute.startsWith('*/')) {
      description += `Every ${minute.slice(2)} minutes`;
    } else {
      description += `At minute ${minute}`;
    }
    
    // Handle hour
    if (hour !== '*') {
      if (hour.startsWith('*/')) {
        description += ` of every ${hour.slice(2)} hours`;
      } else {
        description += ` of hour ${hour}`;
      }
    }
    
    // Handle day of month
    if (dayOfMonth !== '*') {
      description += ` on day ${dayOfMonth} of the month`;
    }
    
    // Handle month
    if (month !== '*') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (month.includes(',')) {
        const monthNumbers = month.split(',').map(m => months[parseInt(m) - 1]).join(', ');
        description += ` in ${monthNumbers}`;
      } else {
        description += ` in ${months[parseInt(month) - 1]}`;
      }
    }
    
    // Handle day of week
    if (dayOfWeek !== '*') {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      if (dayOfWeek.includes(',')) {
        const dayNumbers = dayOfWeek.split(',').map(d => days[parseInt(d)]).join(', ');
        description += ` on ${dayNumbers}`;
      } else {
        description += ` on ${days[parseInt(dayOfWeek)]}`;
      }
    }
    
    return description;
  } catch (error) {
    return 'Unable to parse cron expression';
  }
};

const formatDate = (dateString: string | Date) => {
  return new Date(dateString).toLocaleString();
};

const validator = (json: any) => {
  const errors: {
    path: string[];
    message: string;
    severity: ValidationSeverity;
  }[] = [];
  return errors;
};

const jobDefinitionModel = ref<any>(null);
const loadingJobDefinition = ref(false);

const loadJobDefinition = async () => {
  // Try to get job definition from deployment revisions first
  if (deployment.value?.revisions && deployment.value.revisions.length > 0) {
    const activeRevision = deployment.value.revisions.find(r => r.revision === deployment.value.active_revision) 
      || deployment.value.revisions[deployment.value.revisions.length - 1];
    
    if (activeRevision?.job_definition) {
      jobDefinitionModel.value = activeRevision.job_definition;
      return;
    }
  }

  // Fallback to IPFS if no job definition in revisions
  if (!deployment.value?.ipfs_definition_hash) {
    jobDefinitionModel.value = null;
    return;
  }

  try {
    loadingJobDefinition.value = true;
    const definition = await getIpfs(deployment.value.ipfs_definition_hash);
    jobDefinitionModel.value = definition;
  } catch (err: any) {
    console.error("Error loading job definition:", err);
    jobDefinitionModel.value = null;
  } finally {
    loadingJobDefinition.value = false;
  }
};


const loadDeployment = async (silent = false) => {
  if (!isAuthenticated.value) {
    error.value = "Please log in to view deployments";
    if (!silent) loading.value = false;
    return;
  }

  try {
    if (!silent) loading.value = true;
    error.value = null;

    const deploymentId = route.params.id as string;
    const data = await useApiFetch<Deployment>(`/api/deployments/${deploymentId}`, {
      method: 'GET',
      auth: true,
    });

    deployment.value = data as Deployment;

    await loadJobDefinition();
    
    // Load tasks for scheduled deployments
    await loadTasks();

    if (deployment.value.jobs && deployment.value.jobs.length > 0) {
      for (const job of deployment.value.jobs) {
        // Only fetch state for jobs that aren't already in a completed state
        // Completed states: DONE=2, STOPPED=3, TIMEOUT=4, ERROR=5
        const currentState = jobStates.value[job.job];
        if (currentState !== undefined && currentState >= 2) {
          // Job is already completed, skip fetching
          continue;
        }
        
        try {
          const { data } = await useAPI(`/api/jobs/${job.job}`);
          if (data.value?.state !== undefined) {
            jobStates.value[job.job] = data.value.state;
          }
        } catch (err) {
          console.warn(`Failed to fetch state for job ${job.job}`);
        }
      }
    }
  } catch (err: any) {
    console.error("Error loading deployment:", err);
    error.value = `Failed to load deployment: ${err.message}`;
  } finally {
    if (!silent) loading.value = false;
  }
};



// Action button visibility
const deploymentStatus = computed(() => deployment.value?.status?.toUpperCase());

const canStart = computed(() => {
  const status = deploymentStatus.value;
  return status === 'DRAFT' || status === 'STOPPED' || status === 'ERROR';
});

const canStop = computed(() => {
  const status = deploymentStatus.value;
  return status === 'RUNNING' || status === 'STARTING';
});

const canArchive = computed(() => deploymentStatus.value !== 'ARCHIVED' && deploymentStatus.value !== 'RUNNING' && deploymentStatus.value !== 'STOPPING' && deploymentStatus.value !== 'DRAFT');

const hasAnyActions = computed(() => {
  const status = deploymentStatus.value;
  const hasMainActions = canStart.value || canStop.value || canArchive.value;
  const hasConfigActions = status !== 'ARCHIVED';
  return hasMainActions || hasConfigActions;
});

const statusHelpText = computed(() => {
  switch (deploymentStatus.value) {
    case 'DRAFT':
      return 'Start the deployment to begin running jobs.';
    case 'RUNNING':
      return 'Stop the deployment to halt all running jobs.';
    case 'STOPPED':
      return 'You can start the deployment again or archive it.';
    case 'ERROR':
      return 'Fix any issues and restart the deployment.';
    case 'ARCHIVED':
      return 'This deployment is archived and cannot be modified.';
    default:
      return '';
  }
});

// Job activity split
// Note: Deployment jobs don't include state info, so we show all jobs
// Users can click through to see individual job details
const jobStates = ref<Record<string, number>>({});

// SSE-based endpoint status aggregation per job
const jobEndpointsMap = ref<Map<string, Map<string, any>>>(new Map());

// Track useJob instances for proper cleanup
const activeJobInstances = ref<Map<string, { 
  stopWatching: () => void;
  cleanup?: () => void;
}>>(new Map());

// Clean up job instances that are no longer running
const cleanupJobInstances = (currentRunningJobIds: string[]) => {
  const runningSet = new Set(currentRunningJobIds);
  
  for (const [jobId, instance] of activeJobInstances.value.entries()) {
    if (!runningSet.has(jobId)) {
      // Job is no longer running, clean it up
      instance.stopWatching();
      if (instance.cleanup) instance.cleanup();
      activeJobInstances.value.delete(jobId);
      jobEndpointsMap.value.delete(jobId);
    }
  }
  
  // Trigger reactivity
  activeJobInstances.value = new Map(activeJobInstances.value);
  jobEndpointsMap.value = new Map(jobEndpointsMap.value);
};

// Watch deployment jobs and set up SSE connections via useJob
// Only watch running jobs (state 1) that have endpoints
watch(
  () => {
    const jobs = (deployment.value?.jobs as DeploymentJob[]) || [];
    // Only include running jobs that have state = 1
    return jobs.filter(j => jobStates.value[j.job] === 1);
  },
  (runningJobs: DeploymentJob[]) => {
    const currentRunningJobIds = runningJobs.map(j => j.job).filter(Boolean);
    
    // Clean up instances for jobs that are no longer running
    cleanupJobInstances(currentRunningJobIds);
    
    if (!runningJobs || runningJobs.length === 0) return;
    
    for (const jobItem of runningJobs) {
      const jobId = jobItem.job;
      if (!jobId) continue;
      
      // Skip if already watching this job
      if (activeJobInstances.value.has(jobId)) continue;
      
      try {
        // Use the useJob composable to get live endpoint statuses via SSE
        const { endpoints, pausePolling } = useJob(jobId);
        
        // Watch this job's endpoints and update our aggregated map
        const stopWatching = watch(
          endpoints,
          (endpointsData) => {
            if (endpointsData) {
              jobEndpointsMap.value.set(jobId, endpointsData);
              // Trigger reactivity
              jobEndpointsMap.value = new Map(jobEndpointsMap.value);
            }
          },
          { immediate: true, deep: true }
        );
        
        // Track this instance for cleanup
        activeJobInstances.value.set(jobId, { 
          stopWatching,
          cleanup: pausePolling
        });
      } catch (error) {
        console.warn(`Failed to set up SSE for job ${jobId}:`, error);
      }
    }
  },
  { immediate: true, deep: true }
);

// Aggregate all endpoint statuses by URL across all jobs
const liveEndpointStatusByUrl = computed<Map<string, 'ONLINE' | 'OFFLINE' | 'UNKNOWN'>>(() => {
  const statusMap = new Map<string, 'ONLINE' | 'OFFLINE' | 'UNKNOWN'>();
  
  for (const endpointsForJob of jobEndpointsMap.value.values()) {
    for (const [url, endpointData] of endpointsForJob.entries()) {
      if (endpointData?.status) {
        statusMap.set(url, endpointData.status);
      }
    }
  }
  
  return statusMap;
});

const activeJobs = computed((): DeploymentJob[] => {
  const jobs = (deployment.value?.jobs as DeploymentJob[]) || [];
  // Enrich jobs with fetched states and reverse to show most recent first
  const enrichedJobs = jobs.map(job => ({
    ...job,
    state: jobStates.value[job.job] ?? 0
  })).reverse();
  
  // Filter for running jobs (states: QUEUED=0, RUNNING=1)
  return enrichedJobs.filter(job => job.state === 0 || job.state === 1);
});

const historicalJobs = computed((): DeploymentJob[] => {
  const jobs = (deployment.value?.jobs as DeploymentJob[]) || [];
  // Enrich jobs with fetched states and reverse to show most recent first
  const enrichedJobs = jobs.map(job => ({
    ...job,
    state: jobStates.value[job.job] ?? 0
  })).reverse();
  
  // Filter for completed/stopped jobs (states: DONE=2, STOPPED=3, TIMEOUT=4, ERROR=5)
  return enrichedJobs.filter(job => job.state >= 2);
});

// Deployment endpoints - use live SSE status from nodes when available
const deploymentEndpoints = computed(() => {
  if (!deployment.value?.endpoints) return [];
  const deploymentIsRunning = deployment.value.status === 'RUNNING';
  const hasRunningJobs = activeJobs.value.length > 0;
  
  return deployment.value.endpoints.map((endpoint: any) => {
    const liveStatus = liveEndpointStatusByUrl.value.get(endpoint.url);
    
    // Determine status using global status system
    let status: 'OFFLINE' | 'ONLINE' | 'UNKNOWN' | 'LOADING' = 'OFFLINE';
    
    // If deployment or jobs aren't running, endpoints are offline
    if (!deploymentIsRunning || !hasRunningJobs) {
      status = 'OFFLINE';
    } else if (liveStatus === 'ONLINE') {
      // SSE confirmed online
      status = 'ONLINE';
    } else if (liveStatus === 'OFFLINE') {
      // SSE confirmed offline
      status = 'OFFLINE';
    } else {
      // Jobs are running but no SSE status yet - still checking
      status = 'LOADING';
    }
    
    return {
      opId: endpoint.opId,
      port: endpoint.port,
      url: endpoint.url,
      status
    };
  });
});

// All deployment events
const deploymentEvents = computed((): DeploymentEvent[] => {
  const events = (deployment.value?.events as DeploymentEvent[]) || [];
  // Reverse to show most recent first
  return [...events].reverse();
});

// No vault actions in API mode

// Generic deployment action handler
const executeDeploymentAction = async (
  actionUrl: string,
  successMessage: string,
  shouldRedirect = false
) => {
  if (!deployment.value || !isAuthenticated.value) {
    toast.error("Please log in to perform this action");
    return;
  }

  try {
    actionLoading.value = true;
    await useApiFetch(actionUrl, { method: 'POST', auth: true });
    toast.success(successMessage);

    if (shouldRedirect) {
      setTimeout(() => router.push("/deployments"), 2000);
    } else {
      // Wait a moment for backend to process, then refresh
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadDeployment(true);
      
      // Clear SSE connections and cleanup job instances when stopping to force reconnect on restart
      if (actionUrl.includes('/stop')) {
        // Clean up all active job instances
        for (const [jobId, instance] of activeJobInstances.value.entries()) {
          instance.stopWatching();
          if (instance.cleanup) instance.cleanup();
        }
        activeJobInstances.value.clear();
        jobEndpointsMap.value.clear();
        jobEndpointsMap.value = new Map(jobEndpointsMap.value);
      }
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
  await executeDeploymentAction(
    `/api/deployments/${deployment.value!.id}/start`,
    "Deployment started successfully"
  );
  
  // Start polling for job updates after starting
  startJobPolling();
};

const stopDeployment = async () => {
  await executeDeploymentAction(
    `/api/deployments/${deployment.value!.id}/stop`,
    "Deployment stopped successfully"
  );
  
  // Stop job polling and start status polling after stopping
  stopJobPolling();
  startStatusPolling();
};

const archiveDeployment = async () => {
  if (!confirm("Are you sure you want to archive this deployment? This action cannot be undone.")) {
    return;
  }
  
  await executeDeploymentAction(
    `/api/deployments/${deployment.value!.id}/archive`,
    "Deployment archived successfully",
    true
  );
};

const updateReplicas = async () => {
  if (!newReplicaCount.value || newReplicaCount.value < 1) {
    toast.error("Replica count must be at least 1");
    return;
  }

  await executeDeploymentAction(
    `/api/deployments/${deployment.value!.id}/update-replica-count`,
    `Replica count updated to ${newReplicaCount.value}`
  );
  
  newReplicaCount.value = null;
};

const updateJobTimeout = async () => {
  if (!newTimeoutHours.value || newTimeoutHours.value < 0.0167) {
    toast.error("Timeout must be at least 1 minute (0.0167 hours)");
    return;
  }

  await executeDeploymentAction(
    `/api/deployments/${deployment.value!.id}/update-timeout`,
    `Job timeout updated to ${newTimeoutHours.value} hours`
  );
  
  newTimeoutHours.value = null;
};

const updateSchedule = async () => {
  if (!newSchedule.value || !isValidCronExpression(newSchedule.value)) {
    toast.error("Please enter a valid cron expression");
    return;
  }

  if (!deployment.value || !isAuthenticated.value) {
    toast.error("Please log in to perform this action");
    return;
  }

  try {
    actionLoading.value = true;
    await useApiFetch(`/api/deployments/${deployment.value!.id}/update-schedule`, { 
      method: 'PATCH', 
      auth: true,
      body: { schedule: newSchedule.value }
    });
    
    toast.success(`Schedule updated to: ${newSchedule.value} (${parseCronExpression(newSchedule.value)})`);
    
    // Wait a moment for backend to process, then refresh
    await new Promise(resolve => setTimeout(resolve, 500));
    await loadDeployment(true);
    
    newSchedule.value = '';
  } catch (error: any) {
    console.error('Update schedule error:', error);
    const errorMessage = error.data?.message || error.message || 'Failed to update schedule';
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

  if (!deployment.value || !isAuthenticated.value) {
    toast.error("Please log in to perform this action");
    return;
  }

  try {
    actionLoading.value = true;
    const result = await useApiFetch(`/api/deployments/${deployment.value!.id}/create-revision`, { 
      method: 'POST', 
      auth: true,
      body: revisionJobDefinition.value
    });
    
    toast.success("New revision created successfully!");
    showRevisionModal.value = false;
    
    // Wait a moment for backend to process, then refresh
    await new Promise(resolve => setTimeout(resolve, 500));
    await loadDeployment(true);
    
  } catch (error: any) {
    console.error('Create revision error:', error);
    const errorMessage = error.data?.message || error.message || 'Failed to create revision';
    toast.error(`Error creating revision: ${errorMessage}`);
  } finally {
    actionLoading.value = false;
  }
};

// Switch to a different revision
const switchToRevision = async (revisionNumber: number) => {
  if (!deployment.value || !isAuthenticated.value) {
    toast.error("Please log in to perform this action");
    return;
  }

  try {
    switchingRevision.value = revisionNumber;
    const result = await useApiFetch(`/api/deployments/${deployment.value.id}/update-active-revision`, {
      method: 'PATCH',
      auth: true,
      body: { active_revision: revisionNumber }
    });

    toast.success(`Switched to revision ${revisionNumber} successfully!`);
    
    // Refresh deployment data
    await loadDeployment(true);
    
  } catch (error: any) {
    console.error('Switch revision error:', error);
    const errorMessage = error.data?.message || error.message || 'Failed to switch revision';
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
    
    // Allow wildcard
    if (part === '*') continue;
    
    // Allow step values (*/n)
    if (part.startsWith('*/')) {
      const stepValue = parseInt(part.slice(2));
      if (isNaN(stepValue) || stepValue <= 0) return false;
      continue;
    }
    
    // Allow ranges (n-m) and lists (n,m,...)
    if (part.includes('-') || part.includes(',')) continue;
    
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

// Vault functionality removed in API mode

const generateAuth = async () => {
  actionLoading.value = true;
  try {
    const header = await deployment.value!.generateAuthHeader();
    authHeader.value = header;
    toast.success("Authentication header generated successfully");
  } catch (err: any) {
    console.error("Generate auth error:", err);
    toast.error(`Failed to generate auth header: ${err.message}`);
  } finally {
    actionLoading.value = false;
  }
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  } catch (err) {
    toast.error("Failed to copy to clipboard");
  }
};

const navigateToJob = (jobId: string) => {
  if (!deployment.value?.id) {
    router.push(`/jobs/${jobId}`);
    return;
  }
  router.push(`/deployments/${deployment.value.id}/jobs/${jobId}`);
};

const getJobStateText = (state: number): string => {
  switch (state) {
    case 0: return 'QUEUED';
    case 1: return 'RUNNING';
    case 2: return 'COMPLETED';
    case 3: return 'STOPPED';
    default: return 'UNKNOWN';
  }
};

// Use global status system
const { getStatusClass: getJobStateClass } = useStatus();

const getTaskStatusClass = (status: string): string => {
  switch (status?.toUpperCase()) {
    case 'PENDING': return 'is-info';
    case 'RUNNING': return 'is-success';
    case 'COMPLETED': return 'is-dark';
    case 'FAILED': return 'is-danger';
    case 'CANCELLED': return 'is-warning';
    default: return 'is-light';
  }
};

const loadTasks = async () => {
  if (!deployment.value) {
    return;
  }
  
  tasksLoading.value = true;
  try {
    const { data } = await useAPI(`/api/deployments/${deployment.value.id}/tasks`, {
      auth: true
    });
    tasks.value = data.value || [];
  } catch (err: any) {
    console.error("Load tasks error:", err);
    toast.error(`Failed to load tasks: ${err.message}`);
    tasks.value = [];
  } finally {
    tasksLoading.value = false;
  }
};

// Status polling functionality
const startStatusPolling = () => {
  // Clear any existing interval
  if (statusPollingInterval.value) {
    clearInterval(statusPollingInterval.value);
  }
  
  // Poll every 2 seconds for status updates
  statusPollingInterval.value = setInterval(async () => {
    if (!deployment.value) return;
    
    const currentStatus = deployment.value.status;
    await loadDeployment(true); // Silent reload
    
    // Stop polling when status reaches final state
    if (deployment.value?.status === 'STOPPED' && currentStatus === 'STOPPING') {
      clearInterval(statusPollingInterval.value!);
      statusPollingInterval.value = null;
    }
  }, 2000);
};

const stopStatusPolling = () => {
  if (statusPollingInterval.value) {
    clearInterval(statusPollingInterval.value);
    statusPollingInterval.value = null;
  }
};

// Job activity polling functionality  
const startJobPolling = () => {
  // Clear any existing interval
  if (jobPollingInterval.value) {
    clearInterval(jobPollingInterval.value);
  }
  
  // Poll every 5 seconds for job updates
  jobPollingInterval.value = setInterval(async () => {
    if (!deployment.value) return;
    
    const oldJobCount = deployment.value.jobs?.length || 0;
    await loadDeployment(true); // Silent reload
    const newJobCount = deployment.value?.jobs?.length || 0;
    
    // Stop polling if deployment is no longer running/starting
    const status = deployment.value?.status?.toUpperCase();
    if (status !== 'RUNNING' && status !== 'STARTING') {
      clearInterval(jobPollingInterval.value!);
      jobPollingInterval.value = null;
    }
  }, 5000);
};

const stopJobPolling = () => {
  if (jobPollingInterval.value) {
    clearInterval(jobPollingInterval.value);
    jobPollingInterval.value = null;
  }
};

// Click outside handler to close dropdown
const handleClickOutside = (event: MouseEvent) => {
  if (actionsDropdown.value && !actionsDropdown.value.contains(event.target as Node)) {
    isActionsDropdownOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  stopStatusPolling(); // Clean up polling intervals
  stopJobPolling();
  
  // Clean up all active job instances and their polling
  for (const [jobId, instance] of activeJobInstances.value.entries()) {
    instance.stopWatching();
    if (instance.cleanup) instance.cleanup();
  }
  activeJobInstances.value.clear();
  jobEndpointsMap.value.clear();
});

// Auto-select first job when switching to logs tab
watch(
  () => [activeTab.value, activeJobs.value],
  ([newTab, jobs]) => {
    if (newTab === 'logs' && jobs.length > 0 && !activeLogsJobId.value) {
      activeLogsJobId.value = jobs[0].job;
    }
  },
  { immediate: true }
);

// Debounced authentication watcher to prevent flickering
let authTimeout: NodeJS.Timeout | null = null;

watch(
  isAuthenticated,
  (authed) => {
    // Clear any existing timeout
    if (authTimeout) {
      clearTimeout(authTimeout);
    }
    
    // If authenticated, load deployment if we don't have one
    if (authed) {
      // Clear any error state
      if (error.value === "Please log in to view deployments") {
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
      if (!isAuthenticated.value) {
        // Only show login error if we don't already have deployment data
        // This preserves the deployment during temporary auth interruptions
        if (!deployment.value) {
          error.value = "Please log in to view deployments";
        }
      }
    }, 2000); // 2 second delay to allow auth to re-establish
  },
  { immediate: true }
);

// Watch deployment status to automatically start job polling for running deployments
watch(
  () => deployment.value?.status,
  (newStatus, oldStatus) => {
    if (!newStatus) return;
    
    const status = newStatus.toUpperCase();
    
    // Start job polling when deployment becomes running
    if (status === 'RUNNING' && !jobPollingInterval.value) {
      startJobPolling();
    }
    
    // Stop job polling when deployment stops running
    if (status !== 'RUNNING' && status !== 'STARTING' && jobPollingInterval.value) {
      stopJobPolling();
    }
  },
  { immediate: true }
);

// Watch revision modal to initialize job definition
watch(
  () => showRevisionModal.value,
  (isOpen) => {
    if (isOpen && jobDefinitionModel.value) {
      // Initialize revision job definition with current job definition
      revisionJobDefinition.value = JSON.parse(JSON.stringify(jobDefinitionModel.value));
    }
  }
);

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

.status-running { background-color: $success; }
.status-starting { background-color: $info; }
.status-draft { background-color: $grey; }
.status-stopped { background-color: $grey-dark; }
.status-stopping { background-color: $warning; }
.status-error { background-color: $danger; }
.status-insufficient { background-color: $warning; }
.status-archived { background-color: $grey-light; }
.status-unknown { background-color: $grey-lighter; }

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
  background: white;
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

import React from 'react'
import { generateJQL } from '../../utils/helpers'

export const ConfigPanel = ({ 
    showConfig, 
    jiraConfig, 
    setJiraConfig, 
    timePeriod, 
    customDays 
}) => {
    if (!showConfig) return null

    const handleTemplateClick = (templateQuery) => {
        const query = typeof templateQuery === 'function' ? templateQuery() : templateQuery
        setJiraConfig(prev => ({ ...prev, jqlQuery: query }))
    }

    const templates = [
        {
            name: 'High Priority (PL < 10)',
            query: () => `project = ${jiraConfig.project} AND cf[11129] < 10 AND status not in ("Done", "Closed") ORDER BY cf[11129] ASC`
        },
        {
            name: 'Current Time Period',
            query: () => generateJQL(jiraConfig.project, timePeriod, customDays)
        },
        {
            name: 'Source Label Analysis',
            query: () => `project = ${jiraConfig.project} AND labels in ("src-bug-fix", "src-new-feature", "src-tech-debt", "src-maintenance", "src-research", "src-integration", "src-golive-critical", "src-unknown", "unplanned") AND created >= -${timePeriod === 'custom' ? customDays : timePeriod.replace('d', '')}d`
        },
        {
            name: 'All Active Tickets',
            query: () => `project = ${jiraConfig.project} AND status not in ("Done", "Closed") ORDER BY cf[11129] ASC`
        }
    ]

    return (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Jira Connection Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Jira Base URL</label>
                    <input
                        type="url"
                        value={jiraConfig.baseUrl}
                        onChange={(e) => setJiraConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        autoComplete="off"
                        data-lpignore="true"
                        data-form-type="other"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                        type="email"
                        value={jiraConfig.email}
                        onChange={(e) => setJiraConfig(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        autoComplete="off"
                        data-lpignore="true"
                        data-form-type="other"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">
                        API Token
                        {jiraConfig.apiToken && (
                            <span className="ml-2 text-xs text-green-600 font-normal">
                                (Saved locally)
                            </span>
                        )}
                    </label>
                    <input
                        type="password"
                        value={jiraConfig.apiToken}
                        onChange={(e) => setJiraConfig(prev => ({ ...prev, apiToken: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder={jiraConfig.apiToken ? "••••••••••••••••••••" : "Your Jira API token"}
                        autoComplete="new-password"
                        data-lpignore="true"
                        data-form-type="other"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Project Key</label>
                    <input
                        type="text"
                        value={jiraConfig.project}
                        onChange={(e) => setJiraConfig(prev => ({ ...prev, project: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        autoComplete="off"
                        data-lpignore="true"
                        data-form-type="other"
                    />
                </div>
            </div>
            
            {/* JQL Query Section */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">JQL Query</label>
                <textarea
                    value={jiraConfig.jqlQuery}
                    onChange={(e) => setJiraConfig(prev => ({ ...prev, jqlQuery: e.target.value }))}
                    className="w-full h-24 border border-gray-300 rounded px-3 py-2 font-mono text-sm"
                    placeholder="project = KSD AND cf[11129] > 0 AND created >= -30d ORDER BY created DESC"
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                />
                <div className="mt-2 text-xs text-gray-600">
                    <strong>Default Query:</strong> All KSD tickets with Priority Level &gt; 0 created in last 30 days
                </div>
                <div className="mt-1 text-xs text-blue-600">
                    <strong>Tips:</strong> Use cf[11129] for Priority Level field • Use -30d for last 30 days • Add ORDER BY for sorting
                </div>
            </div>

            {/* Quick JQL Templates */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Quick JQL Templates</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {templates.map((template, index) => (
                        <button
                            key={index}
                            onClick={() => handleTemplateClick(template.query)}
                            className="text-left p-2 border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300"
                        >
                            <div className="font-medium text-sm text-blue-700">{template.name}</div>
                            <div className="text-xs text-gray-500 font-mono truncate">
                                {typeof template.query === 'function' ? template.query() : template.query}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
            
            {!jiraConfig.apiToken && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
                    <strong>Setup Required:</strong> Get your API token from{' '}
                    <a href="https://id.atlassian.com/manage-profile/security/api-tokens" 
                       className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
                        Atlassian Account Settings
                    </a>
                </div>
            )}
            
            {jiraConfig.apiToken && (
                <div className="mt-4 flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                    <span className="text-green-700">
                        <strong>API Token Saved:</strong> Your credentials are stored locally
                    </span>
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to clear your saved API token?')) {
                                setJiraConfig(prev => ({ ...prev, apiToken: '' }))
                            }
                        }}
                        className="text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Clear Token
                    </button>
                </div>
            )}
        </div>
    )
}
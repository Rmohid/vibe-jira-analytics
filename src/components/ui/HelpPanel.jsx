import React from 'react';

export const HelpPanel = ({ showHelp, setShowHelp }) => {
    if (!showHelp) return null;

    const documentationLinks = [
        {
            title: "📚 Top 7 Business Logic",
            description: "Understand what 'Top 7' means, Priority Levels, and workflow",
            file: "TOP7_BUSINESS_LOGIC.md",
            highlights: ["What is Top 7?", "State Transitions", "Ticket Dependencies", "Common Scenarios"]
        },
        {
            title: "📖 Project README",
            description: "Getting started, features, and general documentation",
            file: "README.md",
            highlights: ["Quick Start", "Installation", "Configuration", "Architecture"]
        },
        {
            title: "🐳 Docker Deployment",
            description: "Container deployment for intranet hosting",
            file: "DOCKER_DEPLOYMENT.md",
            highlights: ["Docker Setup", "Kubernetes", "Security", "Troubleshooting"]
        },
        {
            title: "🤖 Development Guide",
            description: "Technical documentation for developers",
            file: "CLAUDE.md",
            highlights: ["Component Structure", "Function Map", "Development Workflow"]
        },
        {
            title: "✅ Test Documentation",
            description: "Test coverage and validation",
            file: "TEST_SUMMARY.md",
            highlights: ["36 Tests", "Coverage Areas", "Validation"]
        }
    ];

    const openDocumentation = (file) => {
        // Open the markdown file in a new tab
        // Note: These files are served as static content from the server
        window.open(`/${file}`, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-blue-600 text-white p-6 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold">Help & Documentation</h2>
                            <p className="text-blue-100 mt-1">Learn about the Jira Analytics Dashboard and Top 7 system</p>
                        </div>
                        <button
                            onClick={() => setShowHelp(false)}
                            className="text-white hover:bg-blue-700 p-2 rounded-lg transition-colors"
                            aria-label="Close help"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Quick Tips */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 m-6">
                    <h3 className="font-semibold text-blue-900 mb-2">Quick Tips</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• <strong>Priority Level &lt; 100</strong>: Ticket is in the "Top 7" active backlog</li>
                        <li>• <strong>Time in Top 7</strong>: Days since a ticket entered the prioritized backlog</li>
                        <li>• <strong>Fixed Tickets</strong>: Tickets that left Top 7 (completed or deprioritized)</li>
                        <li>• <strong>Source Labels</strong>: Categories like src-bug-fix, src-feature, etc.</li>
                    </ul>
                </div>

                {/* Documentation Links */}
                <div className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentation Resources</h3>
                    
                    {documentationLinks.map((doc, index) => (
                        <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                             onClick={() => openDocumentation(doc.file)}>
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-1">{doc.title}</h4>
                                    <p className="text-gray-600 text-sm mb-2">{doc.description}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {doc.highlights.map((highlight, idx) => (
                                            <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                {highlight}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="ml-4 text-blue-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Common Questions */}
                <div className="bg-gray-50 p-6 rounded-b-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Common Questions</h3>
                    <div className="space-y-3">
                        <details className="bg-white rounded-lg p-3 cursor-pointer">
                            <summary className="font-medium text-gray-800">What does "Top 7" mean?</summary>
                            <p className="mt-2 text-gray-600 text-sm">
                                The "Top 7" represents your active prioritized backlog - tickets with Priority Level &lt; 100 
                                that teams should focus on. It's not limited to exactly 7 tickets but represents a manageable 
                                set of high-priority work.
                            </p>
                        </details>
                        
                        <details className="bg-white rounded-lg p-3 cursor-pointer">
                            <summary className="font-medium text-gray-800">How do I configure my Jira connection?</summary>
                            <p className="mt-2 text-gray-600 text-sm">
                                1. Get an API token from your Jira account settings<br/>
                                2. Enter your Jira URL (e.g., https://company.atlassian.net)<br/>
                                3. Enter your email and API token<br/>
                                4. Select your project and click "Fetch Data"
                            </p>
                        </details>
                        
                        <details className="bg-white rounded-lg p-3 cursor-pointer">
                            <summary className="font-medium text-gray-800">What's the difference between Time in Top 7 and Age?</summary>
                            <p className="mt-2 text-gray-600 text-sm">
                                <strong>Age</strong>: Total time since ticket creation<br/>
                                <strong>Time in Top 7</strong>: Time since Priority Level was first assigned (entered active backlog)<br/>
                                Time in Top 7 is more actionable as it shows how long we've known something was important.
                            </p>
                        </details>
                        
                        <details className="bg-white rounded-lg p-3 cursor-pointer">
                            <summary className="font-medium text-gray-800">How are Fixed Tickets calculated?</summary>
                            <p className="mt-2 text-gray-600 text-sm">
                                Fixed Tickets are those that left the Top 7 through:<br/>
                                • <strong>Completion</strong>: Priority Level cleared (set to null)<br/>
                                • <strong>Deprioritization</strong>: Priority Level set &gt; 99<br/>
                                This is based on Priority Level transitions, not Jira status changes.
                            </p>
                        </details>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-100 px-6 py-4 text-center text-sm text-gray-600 rounded-b-lg">
                    <p>For detailed information, click on any documentation link above to open in a new tab.</p>
                </div>
            </div>
        </div>
    );
};
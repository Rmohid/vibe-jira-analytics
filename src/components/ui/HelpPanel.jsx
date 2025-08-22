import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const HelpPanel = ({ showHelp, setShowHelp }) => {
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [markdownContent, setMarkdownContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Utility function to generate anchor IDs from heading text
    const generateAnchorId = (children) => {
        if (!children) return '';
        
        // Extract text content from React children (handles strings, arrays, etc.)
        const extractText = (child) => {
            if (typeof child === 'string') return child;
            if (Array.isArray(child)) return child.map(extractText).join('');
            if (child && typeof child === 'object' && child.props && child.props.children) {
                return extractText(child.props.children);
            }
            return '';
        };
        
        const text = extractText(children);
        return text.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
            .replace(/\s+/g, '-')         // Replace spaces with hyphens
            .replace(/-+/g, '-')          // Replace multiple hyphens with single hyphen
            .replace(/(^-|-$)/g, '');     // Remove leading/trailing hyphens
    };

    const documentationLinks = [
        {
            title: "📚 Top 7 Business Logic",
            description: "Understand what 'Top 7' means, Priority Levels, and workflow",
            file: "TOP7_BUSINESS_LOGIC.md",
            highlights: ["What is Top 7?", "Priority Levels", "State Transitions", "FAQ", "Best Practices"]
        },
        {
            title: "📖 Getting Started",
            description: "Installation, features, and quick start guide",
            file: "README.md",
            highlights: ["Quick Start", "Features", "External API", "Troubleshooting", "Architecture"]
        },
        {
            title: "🔌 API Documentation",
            description: "REST API for Grafana and external integrations",
            file: "API_DOCUMENTATION.md",
            highlights: ["Prometheus Metrics", "Grafana Setup", "JSON Endpoints", "Time Series", "Examples"]
        },
        {
            title: "🐳 Docker Deployment",
            description: "Container deployment and hosting instructions",
            file: "DOCKER_DEPLOYMENT.md",
            highlights: ["Quick Start", "Docker Compose", "Kubernetes", "Security", "Backup"]
        },
        {
            title: "🤖 Development Guide",
            description: "Technical guide for developers and Claude Code",
            file: "CLAUDE.md",
            highlights: ["Architecture", "Function Map", "External API", "Components", "Patterns"]
        }
    ];

    useEffect(() => {
        if (selectedDoc) {
            fetchMarkdownContent(selectedDoc.file);
        }
    }, [selectedDoc]);

    const fetchMarkdownContent = async (filename) => {
        setLoading(true);
        setError(null);
        try {
            // In development, fetch from the Express server port
            const baseUrl = window.location.port === '3000' ? 'http://localhost:3001' : '';
            const response = await fetch(`${baseUrl}/${filename}`);
            if (!response.ok) {
                throw new Error(`Failed to load ${filename}`);
            }
            const text = await response.text();
            setMarkdownContent(text);
        } catch (err) {
            setError(err.message);
            setMarkdownContent('');
        } finally {
            setLoading(false);
        }
    };

    const handleDocumentClick = (doc) => {
        setSelectedDoc(doc);
    };

    const handleBack = () => {
        setSelectedDoc(null);
        setMarkdownContent('');
        setError(null);
    };

    if (!showHelp) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="bg-blue-600 text-white p-6 rounded-t-lg flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            {selectedDoc && (
                                <button
                                    onClick={handleBack}
                                    className="mr-4 text-white hover:bg-blue-700 p-2 rounded-lg transition-colors"
                                    aria-label="Back to documentation list"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                            )}
                            <div>
                                <h2 className="text-2xl font-bold">
                                    {selectedDoc ? selectedDoc.title : 'Help & Documentation'}
                                </h2>
                                <p className="text-blue-100 mt-1">
                                    {selectedDoc ? selectedDoc.description : 'Learn about the Jira Analytics Dashboard and Top 7 system'}
                                </p>
                            </div>
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

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto">
                    {!selectedDoc ? (
                        <>
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
                                    <div key={index} 
                                         className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50"
                                         onClick={() => handleDocumentClick(doc)}>
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
                                                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Common Questions */}
                            <div className="bg-gray-50 p-6">
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

                                    <details className="bg-white rounded-lg p-3 cursor-pointer">
                                        <summary className="font-medium text-gray-800">How do I use the External API with Grafana?</summary>
                                        <p className="mt-2 text-gray-600 text-sm">
                                            1. Install Grafana's JSON datasource plugin<br/>
                                            2. Add datasource with URL: http://your-server/api/external<br/>
                                            3. Use endpoints like /metrics for Prometheus format<br/>
                                            4. See API Documentation for all available endpoints
                                        </p>
                                    </details>
                                    
                                    <details className="bg-white rounded-lg p-3 cursor-pointer">
                                        <summary className="font-medium text-gray-800">Where can I find debug logs?</summary>
                                        <p className="mt-2 text-gray-600 text-sm">
                                            Debug logs are available through the Developer Panel:<br/>
                                            1. Click the 🔧 Dev button in the top navigation<br/>
                                            2. Use "Export Logs" to download the debug log file<br/>
                                            3. Logs include API calls, state changes, and errors
                                        </p>
                                    </details>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Markdown Content View */
                        <div className="p-6">
                            {loading && (
                                <div className="flex justify-center items-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                </div>
                            )}
                            
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                                    <p className="font-semibold">Error loading documentation</p>
                                    <p className="text-sm mt-1">{error}</p>
                                </div>
                            )}
                            
                            {!loading && !error && markdownContent && (
                                <div className="prose prose-lg max-w-none">
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            // Custom renderers for better styling and anchor link support
                                            h1: ({children}) => {
                                                const id = generateAnchorId(children);
                                                return <h1 id={id} className="text-3xl font-bold text-gray-900 mb-4 pb-2 border-b">{children}</h1>;
                                            },
                                            h2: ({children}) => {
                                                const id = generateAnchorId(children);
                                                return <h2 id={id} className="text-2xl font-bold text-gray-800 mt-8 mb-3">{children}</h2>;
                                            },
                                            h3: ({children}) => {
                                                const id = generateAnchorId(children);
                                                return <h3 id={id} className="text-xl font-semibold text-gray-700 mt-6 mb-2">{children}</h3>;
                                            },
                                            h4: ({children}) => {
                                                const id = generateAnchorId(children);
                                                return <h4 id={id} className="text-lg font-semibold text-gray-700 mt-4 mb-2">{children}</h4>;
                                            },
                                            p: ({children}) => <p className="text-gray-600 mb-4 leading-relaxed">{children}</p>,
                                            ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-1 text-gray-600">{children}</ul>,
                                            ol: ({children}) => <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-600">{children}</ol>,
                                            li: ({children}) => <li className="ml-4">{children}</li>,
                                            blockquote: ({children}) => (
                                                <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic text-gray-600 bg-blue-50 py-2 pr-4 rounded-r">
                                                    {children}
                                                </blockquote>
                                            ),
                                            code: ({inline, children}) => {
                                                if (inline) {
                                                    return <code className="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-sm">{children}</code>;
                                                }
                                                return (
                                                    <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                                                        {children}
                                                    </code>
                                                );
                                            },
                                            pre: ({children}) => <pre className="mb-4">{children}</pre>,
                                            table: ({children}) => (
                                                <div className="overflow-x-auto mb-4">
                                                    <table className="min-w-full border border-gray-300">{children}</table>
                                                </div>
                                            ),
                                            thead: ({children}) => <thead className="bg-gray-100">{children}</thead>,
                                            th: ({children}) => <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">{children}</th>,
                                            td: ({children}) => <td className="border border-gray-300 px-4 py-2 text-gray-600">{children}</td>,
                                            a: ({href, children}) => {
                                                // Handle internal anchor links (starting with #)
                                                if (href && href.startsWith('#')) {
                                                    return (
                                                        <a 
                                                            href={href} 
                                                            className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                const targetId = href.substring(1);
                                                                const targetElement = document.getElementById(targetId);
                                                                if (targetElement) {
                                                                    targetElement.scrollIntoView({ 
                                                                        behavior: 'smooth',
                                                                        block: 'start'
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            {children}
                                                        </a>
                                                    );
                                                }
                                                // Handle external links
                                                return (
                                                    <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
                                                        {children}
                                                    </a>
                                                );
                                            },
                                            hr: () => <hr className="my-6 border-gray-300" />,
                                            strong: ({children}) => <strong className="font-semibold text-gray-800">{children}</strong>,
                                            em: ({children}) => <em className="italic">{children}</em>,
                                        }}
                                    >
                                        {markdownContent}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!selectedDoc && (
                    <div className="bg-gray-100 px-6 py-4 text-center text-sm text-gray-600 rounded-b-lg flex-shrink-0">
                        <p>Click on any documentation link to view the full content inline</p>
                    </div>
                )}
            </div>
        </div>
    );
};
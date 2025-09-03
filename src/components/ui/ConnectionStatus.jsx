import React from 'react'
import { CheckIcon, XIcon, ClockIcon } from '../icons/Icons'

export const ConnectionStatus = ({ connectionStatus, lastSync, fromCache }) => {
    const getStatusConfig = () => {
        switch(connectionStatus) {
            case 'connected':
                return {
                    color: 'text-green-600',
                    icon: <CheckIcon />,
                    text: fromCache ? 'Cached Data Loaded' : 'Connected to Jira'
                }
            case 'error':
                return {
                    color: 'text-red-600',
                    icon: <XIcon />,
                    text: 'Connection Error'
                }
            default:
                return {
                    color: 'text-gray-600',
                    icon: <ClockIcon />,
                    text: 'Not Connected'
                }
        }
    }

    const { color, icon, text } = getStatusConfig()

    return (
        <div className={`flex items-center ${color} text-sm`}>
            {icon}
            <span className="ml-2">{text}</span>
            {lastSync && (
                <span className="ml-2 text-gray-500">
                    (Last sync: {new Date(lastSync).toLocaleTimeString()})
                </span>
            )}
        </div>
    )
}
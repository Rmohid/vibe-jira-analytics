import { SourceLabelsContent } from './SourceLabelsContent'

export const SourceLabelsTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null
    
    return <SourceLabelsContent dateLabel={label} payload={payload} realData={{ sourceLabelsTimeSeries: [payload[0].payload] }} isModal={false} />
}
import { AgencyServicesStep } from '../shared/AgencyServicesStep'

interface HojraServicesProps {
    changeState: (value: number) => void
}

export const HojraServices = ({ changeState }: HojraServicesProps) => {
    return (
        <AgencyServicesStep
            onBack={() => changeState(3)}
            onNext={() => changeState(5)}
        />
    )
}

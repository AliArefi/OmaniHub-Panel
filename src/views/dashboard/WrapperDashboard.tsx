import { useAuth } from "@/auth";
import WithoutCenterDashborad from "./WithoutCenterDashborad";
import AnalyticDashboard from "./AnalyticDashboard";
const WrapperDashboard = () => {

    const { user } = useAuth();

    if (!user.has_active_agency) {
        return <WithoutCenterDashborad />;
    }

    return (
        <AnalyticDashboard />
    )
}

export default WrapperDashboard;
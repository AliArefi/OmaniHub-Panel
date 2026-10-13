import { useSessionUser } from '@/store/authStore'

/**
 * The tour is for regular account owners only: admins (any role) and
 * staff-only members (who work inside someone else's agency) never see it.
 * It opens on its own only while the user has no center yet; the header
 * button can replay it for any eligible user.
 */
function useOnboardingTourEligibility() {
    const signedIn = useSessionUser((state) => state.session.signedIn)
    const isAdmin = useSessionUser((state) => (state.user.roles?.length ?? 0) > 0)
    const hasAgency = useSessionUser((state) => !!state.user.has_active_agency)
    const isStaffOnly = useSessionUser(
        (state) =>
            (state.user.staff_contexts?.length ?? 0) > 0 &&
            !state.user.has_active_agency,
    )

    const canUseTour = signedIn && !isAdmin && !isStaffOnly

    return { canUseTour, shouldAutoOpen: canUseTour && !hasAgency }
}

export default useOnboardingTourEligibility

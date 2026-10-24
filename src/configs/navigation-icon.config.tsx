import {
    PiArrowsInDuotone,
    PiBookOpenUserDuotone,
    PiBookBookmarkDuotone,
    PiAcornDuotone,
    PiBagSimpleDuotone,
    PiUserCircleDuotone,
    PiCurrencyCircleDollarDuotone,
    PiListStarDuotone,
    PiFolderOpenDuotone,
    PiSquaresFourDuotone,
    PiBuildingsDuotone,
    PiStorefrontDuotone,
    PiPlusCircleDuotone,
    PiUsersThreeDuotone,
    PiClipboardTextDuotone,
    PiCalendarCheckDuotone,
    PiNewspaperClippingDuotone,
    PiFileTextDuotone,
    PiArticleDuotone,
    PiStackDuotone,
    PiFoldersDuotone,
    PiTagDuotone,
    PiShapesDuotone,
    PiChatsCircleDuotone,
    PiMapPinDuotone,
    PiHandHeartDuotone,
    PiBuildingOfficeDuotone,
    PiTreeStructureDuotone,
    PiUserListDuotone,
    PiIdentificationBadgeDuotone,
    PiShieldCheckDuotone,
    PiCreditCardDuotone,
    PiUserGearDuotone,
    PiGearSixDuotone,
} from 'react-icons/pi'

import type { JSX } from 'react'

export type NavigationIcons = Record<string, JSX.Element>

const navigationIcon: NavigationIcons = {
    home: <PiSquaresFourDuotone />,
    singleMenu: <PiAcornDuotone />,
    collapseMenu: <PiArrowsInDuotone />,
    groupSingleMenu: <PiBookOpenUserDuotone />,
    groupCollapseMenu: <PiBookBookmarkDuotone />,
    groupMenu: <PiBagSimpleDuotone />,
    store: <PiStorefrontDuotone />,
    account: <PiUserCircleDuotone />,
    accountPricing: <PiCurrencyCircleDollarDuotone />,
    newCenter: <PiListStarDuotone />,
    fileManager: <PiFolderOpenDuotone />,
    calendarCheck: <PiCalendarCheckDuotone />,

    // Agency workspace
    myCenters: <PiBuildingsDuotone />,
    addCenter: <PiPlusCircleDuotone />,
    customers: <PiUsersThreeDuotone />,
    bookings: <PiClipboardTextDuotone />,

    // CMS
    cms: <PiNewspaperClippingDuotone />,
    cmsPages: <PiFileTextDuotone />,
    cmsPosts: <PiArticleDuotone />,
    cmsBlocks: <PiStackDuotone />,
    cmsCategories: <PiFoldersDuotone />,
    cmsTags: <PiTagDuotone />,
    cmsTypes: <PiShapesDuotone />,
    cmsComments: <PiChatsCircleDuotone />,

    // Administration
    locations: <PiMapPinDuotone />,
    services: <PiHandHeartDuotone />,
    agencies: <PiBuildingOfficeDuotone />,
    organizations: <PiTreeStructureDuotone />,
    users: <PiUserListDuotone />,
    roles: <PiIdentificationBadgeDuotone />,
    permissions: <PiShieldCheckDuotone />,
    billing: <PiCreditCardDuotone />,
    roleAssignments: <PiUserGearDuotone />,
    settings: <PiGearSixDuotone />,
}

export default navigationIcon

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
    PiCalendarCheck,
} from 'react-icons/pi'

import type { JSX } from 'react'
import { LayoutDashboard, StoreIcon } from 'lucide-react'

export type NavigationIcons = Record<string, JSX.Element>

const navigationIcon: NavigationIcons = {
    home: <LayoutDashboard />,
    singleMenu: <PiAcornDuotone />,
    collapseMenu: <PiArrowsInDuotone />,
    groupSingleMenu: <PiBookOpenUserDuotone />,
    groupCollapseMenu: <PiBookBookmarkDuotone />,
    groupMenu: <PiBagSimpleDuotone />,
    store: <StoreIcon />,    
    account: <PiUserCircleDuotone />,    
    accountPricing: <PiCurrencyCircleDollarDuotone />,
    newCenter: <PiListStarDuotone />,
    fileManager: <PiFolderOpenDuotone />,
    calendarCheck: <PiCalendarCheck />
}

export default navigationIcon

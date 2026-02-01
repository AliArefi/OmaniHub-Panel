import { cloneElement } from 'react'
import type { CommonProps } from '@/@types/common'

type SideProps = CommonProps

const Side = ({ children, ...rest }: SideProps) => {
    return (
        <div className="flex h-full p-6 bg-white dark:bg-gray-800">
            <div className=" flex flex-col justify-center items-center flex-1">
                <div className="w-full xl:max-w-[450px] px-8 max-w-[380px]">
                    {children
                        ? cloneElement(children as React.ReactElement, {
                            ...rest,
                        })
                        : null}
                </div>
            </div>
            <div className="py-6 px-10 lg:flex flex-col flex-1 hidden rounded-3xl items-center justify-center xl:max-w-[520px] 2xl:max-w-[720px] h-full">
                <div className=' flex items-center justify-center w-full'>
                    <img
                        src="/img/others/auth-side-bg-1.jpg"
                        className="h-full rounded-3xl w-[400px] shadow-2xl"
                    />
                </div>
            </div>
        </div>
    )
}

export default Side

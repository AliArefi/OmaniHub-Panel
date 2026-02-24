import { useMemo, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Upload from '@/components/ui/Upload'
import Input from '@/components/ui/Input'
import Select, { Option as DefaultOption } from '@/components/ui/Select'
import Avatar from '@/components/ui/Avatar'
import { Form, FormItem } from '@/components/ui/Form'
import NumericInput from '@/components/shared/NumericInput'
import { countryList } from '@/constants/countries.constant'
import { components } from 'react-select'
import type { ControlProps, OptionProps } from 'react-select'
import sleep from '@/utils/sleep'
import useSWR from 'swr'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { HiOutlineUser } from 'react-icons/hi'
import { TbPlus } from 'react-icons/tb'
import type { GetSettingsProfileResponse } from '../types'
import { useSessionUser } from '@/store/authStore'

type ProfileSchema = {
    name: string
    email: string
    avatar: string
}

type CountryOption = {
    label: string
    dialCode: string
    value: string
}

const { Control } = components

const validationSchema = z.object({
    name: z.string().min(1, { message: 'الاسم مطلوب' }),
    email: z
        .string()
        .min(1, { message: 'البريد الإلكتروني مطلوب' })
        .email({ message: 'البريد الإلكتروني غير صالح' }),
    avatar: z.string(),
})

const CustomSelectOption = (
    props: OptionProps<CountryOption> & { variant: 'country' | 'phone' },
) => {
    return (
        <DefaultOption<CountryOption>
            {...props}
            customLabel={(data, label) => (
                <span className="flex items-center gap-2">
                    <Avatar
                        shape="circle"
                        size={20}
                        src={`/img/countries/${data.value}.png`}
                    />
                    {props.variant === 'country' && <span>{label}</span>}
                    {props.variant === 'phone' && <span>{data.dialCode}</span>}
                </span>
            )}
        />
    )
}

const CustomControl = ({ children, ...props }: ControlProps<CountryOption>) => {
    const selected = props.getValue()[0]
    return (
        <Control {...props}>
            {selected && (
                <Avatar
                    className="ltr:ml-4 rtl:mr-4"
                    shape="circle"
                    size={20}
                    src={`/img/countries/${selected.value}.png`}
                />
            )}
            {children}
        </Control>
    )
}

const SettingsProfile = () => {
    const data = useSessionUser((state) => state.user)

    const dialCodeList = useMemo(() => {
        const newCountryList: Array<CountryOption> = JSON.parse(
            JSON.stringify(countryList),
        )

        return newCountryList.map((country) => {
            country.label = country.dialCode
            return country
        })
    }, [])

    const beforeUpload = (files: FileList | null) => {
        let valid: string | boolean = true

        const allowedFileType = ['image/jpeg', 'image/png']
        if (files) {
            for (const file of files) {
                if (!allowedFileType.includes(file.type)) {
                    valid = 'يرجى رفع ملف بصيغة .jpeg أو .png!'
                }
            }
        }

        return valid
    }

    const {
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        control,
    } = useForm<ProfileSchema>({
        resolver: zodResolver(validationSchema),
    })

    useEffect(() => {
        if (data) {
            reset({
                name: data.name ?? '',
                email: data.email ?? '',
                avatar: data.avatar ?? '',
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data])

    const onSubmit = async (values: ProfileSchema) => {
        await sleep(500)
        if (data) {
            //mutate({ ...data, ...values }, false)
        }
    }

    return (
        <>
            <h4 className="mb-8">المعلومات الشخصية</h4>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-8">
                    <Controller
                        name="avatar"
                        control={control}
                        render={({ field }) => (
                            <div className="flex items-center gap-4">
                                <Avatar
                                    size={90}
                                    className="border-4 border-white bg-gray-100 text-gray-300 shadow-lg"
                                    icon={<HiOutlineUser />}
                                    src={field.value}
                                />
                                <div className="flex items-center gap-2">
                                    <Upload
                                        showList={false}
                                        uploadLimit={1}
                                        beforeUpload={beforeUpload}
                                        onChange={(files) => {
                                            if (files.length > 0) {
                                                field.onChange(
                                                    URL.createObjectURL(
                                                        files[0],
                                                    ),
                                                )
                                            }
                                        }}
                                    >
                                        <Button
                                            variant="solid"
                                            size="sm"
                                            type="button"
                                            icon={<TbPlus />}
                                        >
                                            رفع صورة
                                        </Button>
                                    </Upload>
                                    <Button
                                        size="sm"
                                        type="button"
                                        onClick={() => {
                                            field.onChange('')
                                        }}
                                    >
                                        حذف
                                    </Button>
                                </div>
                            </div>
                        )}
                    />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <FormItem
                        label="الاسم"
                        invalid={Boolean(errors.name)}
                        errorMessage={errors.name?.message}
                    >
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="الاسم"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="البريد الإلكتروني"
                        invalid={Boolean(errors.email)}
                        errorMessage={errors.email?.message}
                    >
                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="email"
                                    autoComplete="off"
                                    placeholder="البريد الإلكتروني"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                </div>

                <div className="flex justify-end">
                    <Button
                        variant="solid"
                        type="submit"
                        loading={isSubmitting}
                    >
                        حفظ
                    </Button>
                </div>
            </Form>
        </>
    )
}

export default SettingsProfile

import { useMemo } from 'react'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import InputGroup from '@/components/ui/InputGroup'
import type { GroupBase } from 'react-select'
import { countryList } from '@/constants/countries.constant'

type CountryOption = {
    label: string
    value: string
    dialCode: string
}

export type PhoneNumberValue = {
    countryCode: string
    localNumber: string
}

type PhoneNumberInputProps = {
    value: PhoneNumberValue
    onChange: (next: PhoneNumberValue) => void
    invalid?: boolean
    placeholder?: string
}

const normalizeDialCode = (dialCode: string) => {
    const digits = dialCode.replace(/\D+/g, '')
    return digits ? `+${digits}` : '+'
}

const PhoneNumberInput = ({
    value,
    onChange,
    invalid,
    placeholder = 'Mobile number',
}: PhoneNumberInputProps) => {
    const options = useMemo(() => {
        return (countryList as CountryOption[]).map((c) => ({
            ...c,
            dialCode: normalizeDialCode(c.dialCode),
            label: `${c.label} (${normalizeDialCode(c.dialCode)})`,
        }))
    }, [])

    const selected = useMemo(() => {
        const cc = normalizeDialCode(value.countryCode || '+968')
        return options.find((o) => o.dialCode === cc) ?? options.find((o) => o.dialCode === '+968') ?? options[0]
    }, [options, value.countryCode])

    return (
        <div dir="ltr">
            <InputGroup className="gap-2">
                <div className="min-w-[150px]">
                    <Select<CountryOption, false, GroupBase<CountryOption>>
                        isSearchable
                        value={selected}
                        options={options}
                        onChange={(opt) => {
                            const dialCode = opt ? normalizeDialCode(opt.dialCode) : value.countryCode
                            onChange({ countryCode: dialCode, localNumber: value.localNumber })
                        }}
                        getOptionValue={(opt) => `${opt.value}-${opt.dialCode}`}
                        invalid={invalid}
                    />
                </div>
                <Input
                    invalid={invalid}
                    type="tel"
                    placeholder={placeholder}
                    autoComplete="tel"
                    value={value.localNumber}
                    onChange={(e) => {
                        const nextLocal = e.target.value
                        onChange({ countryCode: value.countryCode, localNumber: nextLocal })
                    }}
                />
            </InputGroup>
        </div>
    )
}

export default PhoneNumberInput


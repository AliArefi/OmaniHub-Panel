import { NumericFormat, NumericFormatProps } from 'react-number-format'
import Input from '@/components/ui/Input'
import { normalizeDigits } from '@/utils/normalizeDigits'
import type { ReactNode, ComponentType } from 'react'
import type { InputProps } from '@/components/ui'

interface InputAffix {
    inputSuffix?: string | ReactNode
    inputPrefix?: string | ReactNode
}

interface NumberInputProps
    extends Omit<InputProps, 'prefix' | 'suffix'>,
        InputAffix {}

type NumberFormatInputProps = Omit<NumericFormatProps, 'form'> & InputAffix

type NumericInputProps = NumberInputProps & NumberFormatInputProps

const NumberInput = ({
    inputSuffix,
    inputPrefix,
    ...props
}: NumberInputProps) => {
    return (
        <Input
            {...props}
            value={props.value}
            suffix={inputSuffix}
            prefix={inputPrefix}
        />
    )
}

const NumberFormatInput = ({
    onValueChange,
    ...rest
}: NumberFormatInputProps) => {
    return (
        <NumericFormat
            customInput={NumberInput as ComponentType}
            allowedDecimalSeparators={['.', ',']}
            isAllowed={(values) => {
                if (!values.value) {
                    return true
                }

                return /^-?\d*(\.\d*)?$/.test(normalizeDigits(values.value))
            }}
            onValueChange={onValueChange}
            {...rest}
        />
    )
}

const NumericInput = ({
    inputSuffix,
    inputPrefix,
    onValueChange,
    ...rest
}: NumericInputProps) => {
    return (
        <NumberFormatInput
            inputPrefix={inputPrefix}
            inputSuffix={inputSuffix}
            onValueChange={onValueChange}
            {...rest}
        />
    )
}

export default NumericInput

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Menu from '@/components/ui/Menu'
import Question from './Question'
import useTranslation from '@/utils/hooks/useTranslation'
import { questionCategories } from '../constants'
import isLastChild from '@/utils/isLastChild'

const Faq = () => {
    const { t } = useTranslation()
    const [selectedCategory, setSelectedCategory] = useState('subscription')

    return (
        <Card>
            <h3 className="mt-2">{t('plansFaq.title')}</h3>
            <div className="flex flex-col md:flex-row gap-4 md:gap-20 mt-8">
                <div className="min-w-[230px] mb-3 sm:mb-0 pb-3 sm:pb-3 border-b sm:border-b-0 border-gray-300 ">
                    <Menu className='flex sm:block items-center'>
                        {Object.keys(questionCategories).map((key) => (
                            <Menu.MenuItem
                                key={key}
                                isActive={key === selectedCategory}
                                eventKey={key}
                                onSelect={setSelectedCategory}
                            >
                                {t(`plansFaq.categories.${key}`)}
                            </Menu.MenuItem>
                        ))}
                    </Menu>
                </div>
                <div className="max-w-[800px] my-2">
                    <div className="">
                        {questionCategories[selectedCategory as keyof typeof questionCategories].map(
                            (questionKey, index, questions) => (
                                <Question
                                    key={questionKey}
                                    border={
                                        !isLastChild(
                                            questions,
                                            index,
                                        )
                                    }
                                    isFirstChild={index === 0}
                                    title={t(`plansFaq.questions.${questionKey}.title`)}
                                    content={t(`plansFaq.questions.${questionKey}.content`)}
                                    defaultExpand={index === 0}
                                />
                            ),
                        )}
                    </div>
                </div>
            </div>
        </Card>
    )
}

export default Faq

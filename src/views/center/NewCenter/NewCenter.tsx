import { Container } from '@/components/shared'
import { Card } from '@/components/ui'
import { FormGeneralSection } from './components/FormGeneralSection'

export default function NewCenter() {
    return (
        <Container>
            <div className="flex flex-col xl:flex-row gap-4">
                <div className="flex-auto">
                    <Card>
                        <FormGeneralSection />
                    </Card>
                </div>
                <div className="lg:min-w-[400px] 2xl:w-[500px]">
                    <Card>
                        <h4 className="mb-6">إنشاء حُجرة إلكترونية جديدة</h4>
                        <p>
                            يمكنك إنشاء حُجرتك الإلكترونية بسهولة من خلال إدخال
                            الاسم، وكتابة وصفٍ مختصر، واختيار فئة النشاط. بعد
                            ذلك سيكون لديك حُجرتك الخاصة على المنصة لعرض خدماتك
                            أو منتجاتك والتواصل مع الآخرين.
                        </p>
                    </Card>
                </div>
            </div>
        </Container>
    )
}

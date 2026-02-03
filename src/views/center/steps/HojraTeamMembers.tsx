import { Button, Card, FormItem, Input } from "@/components/ui";
import { useState, useRef } from "react";

interface HojraTeamMembersProps {
    changeState: (value: number) => void;
}

interface TeamMember {
    id: number;
    name: string;
    description: string;
    image: string | null;
}

export const HojraTeamMembers = ({ changeState }: HojraTeamMembersProps) => {
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [addedMembers, setAddedMembers] = useState<TeamMember[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // هندل کردن آپلود عکس
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    // حذف عکس انتخاب شده
    const handleRemoveImage = () => {
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // بررسی کامل بودن فرم
    const isFormComplete = (): boolean => {
        return (
            name.trim() !== "" &&
            description.trim() !== "" &&
            imagePreview !== null
        );
    };

    // افزودن عضو جدید
    const handleAddMember = () => {
        if (!isFormComplete()) return;

        const newMember: TeamMember = {
            id: Date.now(),
            name: name.trim(),
            description: description.trim(),
            image: imagePreview,
        };

        setAddedMembers((prev) => [...prev, newMember]);

        // پاک کردن فرم
        setName("");
        setDescription("");
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // حذف عضو
    const handleDeleteMember = (id: number) => {
        setAddedMembers((prev) => prev.filter((member) => member.id !== id));
    };

    return (
        <Card
            header={{
                content: "أعضاء الفريق",
                bordered: false,
            }}
        >
            <div className="space-y-4">
                {/* فیلد آپلود عکس */}
                <FormItem label="صورة العضو">
                    <div className="flex flex-col gap-3">
                        {!imagePreview ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary-deep hover:bg-gray-50 transition-all"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-8 h-8 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                <span className="text-sm text-gray-500">
                                    اضغط لإضافة صورة
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Button
                                        variant="default"
                                        size="sm"
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        تغيير الصورة
                                    </Button>
                                    <Button
                                        variant="solid"
                                        size="sm"
                                        type="button"
                                        className="bg-red-300 hover:bg-red-400 transition-all"
                                        onClick={handleRemoveImage}
                                    >
                                        حذف الصورة
                                    </Button>
                                </div>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                        />
                    </div>
                </FormItem>

                {/* فیلد نام */}
                <FormItem label="اسم العضو">
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="اسم العضو"
                    />
                </FormItem>

                {/* فیلد توضیح */}
                <FormItem label="وصف موجز">
                    <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="مثلاً: مختصة في العناية بالبشرة"
                    />
                </FormItem>

                {/* دکمه افزودن */}
                <FormItem>
                    <Button
                        variant="default"
                        type="button"
                        block
                        disabled={!isFormComplete()}
                        onClick={handleAddMember}
                    >
                        إضافة عضو
                    </Button>
                </FormItem>

                {/* لیست اعضا اضافه شده */}
                {addedMembers.length > 0 && (
                    <div className="mt-6 space-y-3">
                        <h3 className="text-lg font-semibold">أعضاء الفريق المضافون</h3>
                        {addedMembers.map((member) => (
                            <Card key={member.id}>
                                <div className="flex justify-between items-center flex-row gap-3">
                                    <div className="flex items-center gap-3 flex-1">
                                        {/* عکس عضو */}
                                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-200 shrink-0">
                                            <img
                                                src={member.image!}
                                                alt={member.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* اطلاعات عضو */}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-primary-deep text-base truncate">
                                                {member.name}
                                            </div>
                                            <div className="text-sm text-gray-600 truncate">
                                                {member.description}
                                            </div>
                                        </div>
                                    </div>

                                    {/* دکمه حذف */}
                                    <div className="shrink-0">
                                        <Button
                                            variant="solid"
                                            shape="circle"
                                            size="xs"
                                            className="bg-red-300 hover:bg-red-400 transition-all"
                                            onClick={() => handleDeleteMember(member.id)}
                                        >
                                            حذف
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* نویگیشن */}
                <div>
                    <div className="flex items-center justify-end gap-3">
                        <Button size="sm" variant="default" onClick={() => changeState(2)}>
                            خلف
                        </Button>
                        {addedMembers.length > 0 && (
                            <Button size="sm" variant="solid" onClick={() => changeState(4)}>
                                سجل وإنهاء
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

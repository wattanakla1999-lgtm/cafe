"use client";

import React, { useState, useRef } from "react";
import { useMenu } from "../context/MenuContext";
import { Button } from "./Button";
import * as XLSX from "xlsx";

interface BulkImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ParsedItem {
    category: string;
    name: string;
    price: number;
    description?: string;
    isValid: boolean;
    error?: string;
}

export function BulkImportModal({ isOpen, onClose }: BulkImportModalProps) {
    const { bulkImportMenuItems } = useMenu();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [fileName, setFileName] = useState<string>("");

    // Reset state on open
    React.useEffect(() => {
        if (isOpen) {
            setParsedItems([]);
            setFileName("");
            setIsProcessing(false);
        }
    }, [isOpen]);

    const handleDownloadTemplate = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [
            ["Category", "Name", "Price", "Description"],
            ["Coffee", "Americano", 60, "Espresso with hot water"],
            ["Bakery", "Croissant", 65, "Butter croissant"]
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "menu_template.xlsx");
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: "binary" });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws) as any[];

            // Validate and Map
            const items: ParsedItem[] = data.map((row, index) => {
                const category = row["Category"] || row["หมวดหมู่"];
                const name = row["Name"] || row["ชื่อเมนู"];
                const price = row["Price"] || row["ราคา"];
                const description = row["Description"] || row["รายละเอียด"];

                let error = "";
                if (!category) error += "Missing Category. ";
                if (!name) error += "Missing Name. ";
                if (!price || isNaN(Number(price))) error += "Invalid Price. ";

                return {
                    category: category?.toString().trim(),
                    name: name?.toString().trim(),
                    price: Number(price),
                    description: description?.toString().trim(),
                    isValid: !error,
                    error
                };
            });

            setParsedItems(items);
        };
        reader.readAsBinaryString(file);
    };

    const handleImport = async () => {
        const validItems = parsedItems.filter(i => i.isValid);
        if (validItems.length === 0) return;

        setIsProcessing(true);
        const result = await bulkImportMenuItems(validItems);
        setIsProcessing(false);

        if (result.success) {
            alert(`Imported ${validItems.length} items successfully!`);
            onClose();
        } else {
            alert("Import failed: " + result.error);
        }
    };

    if (!isOpen) return null;

    const validCount = parsedItems.filter(i => i.isValid).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl m-4 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">นำเข้าเมนูจาก Excel</h2>
                        <p className="text-sm text-gray-500">อัปโหลดไฟล์ .xlsx เพื่อเพิ่มเมนูหลายรายการพร้อมกัน</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {/* Actions */}
                    <div className="flex gap-4 mb-6">
                        <Button variant="outline" onClick={handleDownloadTemplate} className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            ดาวน์โหลดไฟล์ตัวอย่าง
                        </Button>
                        <div className="relative">
                            <Button onClick={() => fileInputRef.current?.click()}>
                                {fileName ? "เปลี่ยนไฟล์" : "เลือกไฟล์"}
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".xlsx, .xls"
                                className="hidden"
                            />
                        </div>
                        {fileName && <span className="self-center text-sm text-gray-600">เลือกแล้ว: <b>{fileName}</b></span>}
                    </div>

                    {/* Preview Table */}
                    {parsedItems.length > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-700 font-bold border-b">
                                    <tr>
                                        <th className="px-4 py-3">สถานะ</th>
                                        <th className="px-4 py-3">หมวดหมู่</th>
                                        <th className="px-4 py-3">ชื่อ</th>
                                        <th className="px-4 py-3">ราคา</th>
                                        <th className="px-4 py-3">รายละเอียด</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {parsedItems.map((item, idx) => (
                                        <tr key={idx} className={item.isValid ? "bg-white" : "bg-red-50"}>
                                            <td className="px-4 py-2">
                                                {item.isValid ? (
                                                    <span className="text-green-600 font-bold">✓ พร้อม</span>
                                                ) : (
                                                    <span className="text-red-600 font-bold">{item.error}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2">{item.category}</td>
                                            <td className="px-4 py-2">{item.name}</td>
                                            <td className="px-4 py-2">{item.price}</td>
                                            <td className="px-4 py-2 text-gray-500">{item.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {parsedItems.length === 0 && (
                        <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-xl">
                            <p>อัปโหลดไฟล์ Excel เพื่อดูตัวอย่างรายการที่จะนำเข้า</p>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 sticky bottom-0">
                    <Button variant="secondary" onClick={onClose} disabled={isProcessing}>ยกเลิก</Button>
                    <Button
                        onClick={handleImport}
                        disabled={isProcessing || validCount === 0}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {isProcessing ? "กำลังนำเข้า..." : `ยืนยันการนำเข้า (${validCount} รายการ)`}
                    </Button>
                </div>
            </div>
        </div>
    );
}

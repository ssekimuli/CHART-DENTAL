const fs = require('fs');

const file = 'C:/Users/sseki/Documents/CHART-DENTAL/src/app/(dashboard)/billing/components/invoice-form.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update Props
content = content.replace(
    /type InvoiceFormProps = \{[\s\S]*?\};[\s\S]*?export function InvoiceForm\([^)]+\) \{/,
    `type InvoiceFormProps = {
    invoice?: Invoice;
    patients: Patient[];
    onSave: (data: Omit<Invoice, 'id' | 'patientName' | 'branchId' | 'amount' | 'paidAmount' >, treatments: InvoiceTreatment[]) => void;
    onOpenChange: (open: boolean) => void;
    asModal?: boolean;
};

export function InvoiceForm({ invoice, patients, onSave, onOpenChange, asModal = true }: InvoiceFormProps) {`
);

// 2. Refactor Render Block
// The render block starts at `return (` and goes to the end.
const renderStartRegex = /return \(\s*<Dialog open=\{true\} onOpenChange=\{onOpenChange\}>\s*<DialogContent[^>]+>\s*<DialogHeader>\s*<DialogTitle>[^<]+<\/DialogTitle>\s*<DialogDescriptionComponent>[^<]+<\/DialogDescriptionComponent>\s*<\/DialogHeader>\s*<div className="flex-grow overflow-y-auto pr-6 -mr-6">\s*<Form \{\.\.\.form\}>\s*<form onSubmit=\{form\.handleSubmit\(onSubmit\)\} className="space-y-4 pr-1">/;
const match = content.match(renderStartRegex);

if (match) {
    let newRenderStart = `const formContent = (
            <div className={asModal ? "flex-grow overflow-y-auto pr-6 -mr-6" : ""}>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className={asModal ? "space-y-4 pr-1" : "space-y-6"}>`;
    content = content.replace(renderStartRegex, newRenderStart);

    // Replace the grid layout for discount, tax, insurance, status, paymentMethod, issueDate, dueDate
    // It's located from `<div className="grid grid-cols-3 gap-4">` to the end of due date.
    // We can do this with targeted replacements.
    // First, let's remove the wrapping `<div className="grid grid-cols-2 gap-4">` around status and paymentMethod.
    content = content.replace(/<div className="grid grid-cols-2 gap-4">\s*(<FormField[\s\S]*?name="status"[\s\S]*?<\/FormField>)\s*(<FormField[\s\S]*?name="paymentMethod"[\s\S]*?<\/FormField>)\s*<\/div>/, "$1\n                            $2");
    
    // Same for issueDate and dueDate
    content = content.replace(/<div className="grid grid-cols-2 gap-4">\s*(<FormField[\s\S]*?name="issueDate"[\s\S]*?<\/FormField>)\s*(<FormField[\s\S]*?name="dueDate"[\s\S]*?<\/FormField>)\s*<\/div>/, "$1\n                            $2");

    // Now, wrap all of them in a single 3-column grid.
    // The discount field starts with `<div className="grid grid-cols-3 gap-4">`
    content = content.replace(/<div className="grid grid-cols-3 gap-4">/, `<div className="grid grid-cols-1 md:grid-cols-3 gap-4">`);
    
    // We need to move issueDate and dueDate up to this grid!
    // Let's extract issueDate and dueDate
    const datesRegex = /(<FormField[\s\S]*?name="issueDate"[\s\S]*?<\/FormField>)\s*(<FormField[\s\S]*?name="dueDate"[\s\S]*?<\/FormField>)/;
    const datesMatch = content.match(datesRegex);
    if (datesMatch) {
        const datesStr = datesMatch[0];
        content = content.replace(datesStr, ""); // remove from original position
        
        // Find the end of the `name="paymentMethod"` FormField and insert it there.
        content = content.replace(/(<FormField[\s\S]*?name="paymentMethod"[\s\S]*?<\/FormField>)/, `$1\n                            ${datesStr}\n                        </div>`); // Close the 3-col grid
    }

    // Now remove the closing `</div>` that used to close the `grid-cols-3` (which was right before the Subtotal section).
    // The Subtotal section starts with `<div className="rounded-md border p-4 space-y-2">`
    content = content.replace(/<\/div>\s*<div className="rounded-md border p-4 space-y-2">/, '<div className="rounded-md border p-4 space-y-2">');

    // Update DialogFooter to use dynamic classes and extract it out
    content = content.replace(/<DialogFooter className="sticky bottom-0 bg-background pt-4 -mx-6 px-6 pb-6 border-t">([\s\S]*?)<\/DialogFooter>/, 
    `<div className={cn("flex justify-end space-x-2 pt-4", asModal ? "sticky bottom-0 bg-background -mx-6 px-6 pb-6 border-t" : "")}>
        $1
    </div>`);

    // Replace the end of the file
    content = content.replace(/<\/form>\s*<\/Form>\s*<\/div>\s*<\/DialogContent>\s*<\/Dialog>/, 
    `</form>
                </Form>
            </div>
  );

  if (!asModal) {
      return formContent;
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>{invoice ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle>
                <DialogDescriptionComponent>
                   {invoice ? 'Update the details for the invoice.' : 'Select a patient and add treatments to the invoice.'}
                </DialogDescriptionComponent>
            </DialogHeader>
            {formContent}
        </DialogContent>
    </Dialog>
  );`);
}

fs.writeFileSync(file, content);
console.log("Refactored invoice form.");

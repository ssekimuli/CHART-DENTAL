import sys
path = r"C:\Users\sseki\Documents\CHART-DENTAL\src\app\(dashboard)\patients\[id]\charting\page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

start_idx = content.find(" const handleUpdateSoftTissueRecord")
if start_idx == -1:
    print("start not found")
    sys.exit(1)

end_idx = content.find("  const handleQuickLogCondition", start_idx)
if end_idx == -1:
    print("end not found")
    sys.exit(1)

new_functions = """ const handleUpdateSoftTissueRecord = async (record: SoftTissueRecord) => {
    if (!patient) return;
    const updatedPatient = await updateSoftTissueRecord(patient.id, record);
    if (updatedPatient) {
        setPatient(updatedPatient);
    }
 }

  const handleDeleteSoftTissueRecord = async (recordId: string | number) => {
    if (!patient) return;
    const updatedPatient = await deleteSoftTissueRecord(patient.id, recordId);
    if (updatedPatient) {
        setPatient(updatedPatient);
    }
  }

  const handleSaveEndoRecord = async (record: Omit<EndodonticRecord, 'id' | 'date'>) => {
    if (!patient) return;
    const updatedPatient = await saveEndodonticRecord(patient.id, record);
    if (updatedPatient) {
        setPatient(updatedPatient);
    }
  }

  const handleUpdateEndoRecord = async (record: EndodonticRecord) => {
    if (!patient) return;
    const updatedPatient = await updateEndodonticRecord(patient.id, record);
    if (updatedPatient) {
        setPatient(updatedPatient);
    }
  }

  const handleDeleteEndoRecord = async (recordId: string | number) => {
    if (!patient) return;
    const updatedPatient = await deleteEndodonticRecord(patient.id, recordId);
    if (updatedPatient) {
        setPatient(updatedPatient);
    }
  }

  const handleSaveRestorativeRecord = async (record: Omit<RestorativeRecord, 'id' | 'createdAt' | 'updatedAt'> & { procedureCost?: number, materialCost?: number, otherCharges?: number }) => {
    if (!patient) return;
    const updatedPatient = await saveRestorativeRecord(patient.id, record);
    if (updatedPatient) {
        setPatient(updatedPatient);
    }
  }

  const handleUpdateRestorativeRecord = async (record: RestorativeRecord) => {
    if (!patient) return;
    const updatedPatient = await updateRestorativeRecord(patient.id, record);
    if (updatedPatient) {
        setPatient(updatedPatient);
    }
  }

  const handleDeleteRestorativeRecord = async (recordId: string | number) => {
    if (!patient) return;
    const updatedPatient = await deleteRestorativeRecord(patient.id, recordId);
     if (updatedPatient) {
        setPatient(updatedPatient);
    }
  }

  const handleOpenTreatmentForm = (toothId: number) => {
    setSelectedToothForTreatment(toothId);
    setIsTreatmentFormOpen(true);
  }
  
  const handleCloseTreatmentForm = () => {
    setIsTreatmentFormOpen(false);
    setSelectedToothForTreatment(undefined);
  }
  
  const handleOpenConditionLogger = (toothId: number) => {
    setSelectedToothForCondition(toothId);
    setIsConditionLoggerOpen(true);
  }

"""

new_content = content[:start_idx] + new_functions + content[end_idx:]

with open(path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("done")

import os
import shutil

dest_dir = r"C:\Users\sseki\Documents\CHART-DENTAL\public\teeth_top"
os.makedirs(dest_dir, exist_ok=True)

incisor_path = r"C:\Users\sseki\.gemini\antigravity-cli\brain\89e10167-bd2d-435a-b2d9-8054806cb1e8\incisor_top_1784977938355.jpg"
canine_path = r"C:\Users\sseki\.gemini\antigravity-cli\brain\89e10167-bd2d-435a-b2d9-8054806cb1e8\canine_top_1784977947140.jpg"
premolar_path = r"C:\Users\sseki\.gemini\antigravity-cli\brain\89e10167-bd2d-435a-b2d9-8054806cb1e8\premolar_top_1784977956615.jpg"
molar_path = r"C:\Users\sseki\.gemini\antigravity-cli\brain\89e10167-bd2d-435a-b2d9-8054806cb1e8\molar_top_1784977965902.jpg"

incisors = [11, 12, 21, 22, 31, 32, 41, 42, 51, 52, 61, 62, 71, 72, 81, 82]
canines = [13, 23, 33, 43, 53, 63, 73, 83]
premolars = [14, 15, 24, 25, 34, 35, 44, 45]
molars = [16, 17, 18, 26, 27, 28, 36, 37, 38, 46, 47, 48, 54, 55, 64, 65, 74, 75, 84, 85]

for t in incisors:
    shutil.copy(incisor_path, os.path.join(dest_dir, f"{t}.jpg"))
for t in canines:
    shutil.copy(canine_path, os.path.join(dest_dir, f"{t}.jpg"))
for t in premolars:
    shutil.copy(premolar_path, os.path.join(dest_dir, f"{t}.jpg"))
for t in molars:
    shutil.copy(molar_path, os.path.join(dest_dir, f"{t}.jpg"))

print("Successfully copied all 52 teeth images.")

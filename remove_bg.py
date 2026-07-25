from PIL import Image
import os

def remove_white_bg(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    
    newData = []
    for item in datas:
        # Change all white (also shades of whites)
        # to transparent
        if item[0] > 230 and item[1] > 230 and item[2] > 230:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(output_path, "PNG")

dest_dir = r"C:\Users\sseki\Documents\CHART-DENTAL\public\teeth_top"
os.makedirs(dest_dir, exist_ok=True)

incisor_path = r"C:\Users\sseki\.gemini\antigravity-cli\brain\89e10167-bd2d-435a-b2d9-8054806cb1e8\incisor_top_v2_1784978083323.jpg"
canine_path = r"C:\Users\sseki\.gemini\antigravity-cli\brain\89e10167-bd2d-435a-b2d9-8054806cb1e8\canine_top_v2_1784978092101.jpg"
premolar_path = r"C:\Users\sseki\.gemini\antigravity-cli\brain\89e10167-bd2d-435a-b2d9-8054806cb1e8\premolar_top_v2_1784978101531.jpg"
molar_path = r"C:\Users\sseki\.gemini\antigravity-cli\brain\89e10167-bd2d-435a-b2d9-8054806cb1e8\molar_top_v2_1784978109018.jpg"

incisors = [11, 12, 21, 22, 31, 32, 41, 42, 51, 52, 61, 62, 71, 72, 81, 82]
canines = [13, 23, 33, 43, 53, 63, 73, 83]
premolars = [14, 15, 24, 25, 34, 35, 44, 45]
molars = [16, 17, 18, 26, 27, 28, 36, 37, 38, 46, 47, 48, 54, 55, 64, 65, 74, 75, 84, 85]

for t in incisors:
    remove_white_bg(incisor_path, os.path.join(dest_dir, f"{t}.png"))
for t in canines:
    remove_white_bg(canine_path, os.path.join(dest_dir, f"{t}.png"))
for t in premolars:
    remove_white_bg(premolar_path, os.path.join(dest_dir, f"{t}.png"))
for t in molars:
    remove_white_bg(molar_path, os.path.join(dest_dir, f"{t}.png"))

print("Successfully processed and copied all 52 teeth images as transparent PNGs.")

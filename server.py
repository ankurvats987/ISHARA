from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from PIL import Image, ExifTags
import os
import whisper

app = Flask(__name__)
CORS(app)  # Enable CORS for all origins

# Define the sign language mapping with JPG images
sign_language_mapping = {
    'a': 'static/images/A.jpg',
    'b': 'static/images/B.jpg',
    'c': 'static/images/C.jpg',
    'd': 'static/images/D.jpg',
    'e': 'static/images/E.jpg',
    'f': 'static/images/F.jpg',
    'g': 'static/images/G.jpg',
    'h': 'static/images/H.jpg',
    'i': 'static/images/I.jpg',
    'j': 'static/images/J.jpg',
    'k': 'static/images/K.jpg',
    'l': 'static/images/L.jpg',
    'm': 'static/images/M.jpg',
    'n': 'static/images/N.jpg',
    'o': 'static/images/O.jpg',
    'p': 'static/images/P.jpg',
    'q': 'static/images/Q.jpg',
    'r': 'static/images/R.jpg',
    's': 'static/images/S.jpg',
    't': 'static/images/T.jpg',
    'u': 'static/images/U.jpg',
    'v': 'static/images/V.jpg',
    'w': 'static/images/W.jpg',
    'x': 'static/images/X.jpg',
    'y': 'static/images/Y.jpg',
    'z': 'static/images/Z.jpg',
    ' ': 'static/images/white.jpg'
}

def correct_image_orientation(image):
    try:
        exif = image._getexif()
        if exif:
            for tag, value in exif.items():
                if tag in ExifTags.TAGS and ExifTags.TAGS[tag] == 'Orientation':
                    if value == 2:
                        image = image.transpose(Image.FLIP_LEFT_RIGHT)
                    elif value == 3:
                        image = image.rotate(180, expand=True)
                    elif value == 4:
                        image = image.rotate(180, expand=True).transpose(Image.FLIP_LEFT_RIGHT)
                    elif value == 5:
                        image = image.rotate(270, expand=True).transpose(Image.FLIP_LEFT_RIGHT)
                    elif value == 6:
                        image = image.rotate(270, expand=True)
                    elif value == 7:
                        image = image.rotate(90, expand=True).transpose(Image.FLIP_LEFT_RIGHT)
                    elif value == 8:
                        image = image.rotate(90, expand=True)
                    break
    except (AttributeError, KeyError, IndexError) as e:
        print(f"Error reading EXIF data: {e}")
    return image

def resize_image(image, max_size=(100, 100)):
    image = correct_image_orientation(image)
    image.thumbnail(max_size, Image.Resampling.LANCZOS)
    return image

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load the Whisper model
model = whisper.load_model("base")

@app.route('/')
def index():
    return render_template('english-to-isl.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    file = request.files['audio']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    file_path = os.path.join(UPLOAD_FOLDER, 'recording.wav')
    file.save(file_path)

    # Process the audio file with Whisper
    try:
        result = model.transcribe(file_path)
        transcription = result.get("text", "")
        
        if not transcription:
            return jsonify({'error': 'No transcription found'}), 400

        letters = list(transcription.lower()) # Use a list to preserve the order
        print(letters)

        # Get images for each letter
        images = [sign_language_mapping.get(letter) for letter in letters if letter in sign_language_mapping]
        response = jsonify({'transcription': transcription, 'images': images})
        response.charset = 'utf-8'
        return response

    except Exception as e:
        print(f'Error processing audio: {e}')
        return jsonify({'error': 'Error processing audio'}), 500

if __name__ == '__main__':
    app.run(debug=True)

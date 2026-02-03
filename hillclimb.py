import tensorflow as tf
import cv2
import numpy as np
import keyboard
from flask import Flask, render_template, Response

from utils import load_graph, detect_hands, predict
from utils import ORANGE, RED, GREEN

# ------------------ FLASK APP ------------------

app = Flask(__name__, template_folder="./templates")

# ------------------ CONFIG ------------------

WIDTH = 640
HEIGHT = 480
THRESHOLD = 0.6
ALPHA = 0.3
MODEL_PATH = "model/pretrained_model.pb"

# ------------------ ROUTES ------------------

@app.route("/")
def index():
    return render_template("index.html")

# ------------------ VIDEO STREAM ------------------

def generate_frames():
    # Load TensorFlow model ONCE
    graph, sess = load_graph(MODEL_PATH)

    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, HEIGHT)

    if not cap.isOpened():
        print("❌ Camera not accessible")
        return

    while True:
        success, frame = cap.read()
        if not success:
            break

        # Mirror view
        frame = cv2.flip(frame, 1)

        # Convert to RGB
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Hand detection
        boxes, scores, classes = detect_hands(rgb, graph, sess)
        results = predict(boxes, scores, classes, THRESHOLD, WIDTH, HEIGHT)

        # Default state
        text = "Idle"
        keyboard.release("left")
        keyboard.release("right")

        if len(results) == 1:
            x_min, x_max, y_min, y_max, category = results[0]
            x = int((x_min + x_max) / 2)
            y = int((y_min + y_max) / 2)

            cv2.circle(frame, (x, y), 6, RED, -1)

            # ------------------ HILL CLIMB CONTROLS ------------------

            if category == "Open":
                # Accelerate
                keyboard.press("right")
                text = "Accelerate"

            elif category == "Closed":
                # Brake / Reverse
                keyboard.press("left")
                text = "Brake"

            cv2.putText(
                frame,
                text,
                (x_min, max(25, y_min - 10)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                GREEN,
                2,
            )

        # ------------------ ZONE OVERLAY ------------------

        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (WIDTH // 2, HEIGHT), ORANGE, -1)
        cv2.rectangle(overlay, (WIDTH // 2, 0), (WIDTH, HEIGHT), ORANGE, -1)
        cv2.addWeighted(overlay, ALPHA, frame, 1 - ALPHA, 0, frame)

        # ------------------ STREAM FRAME ------------------

        ret, buffer = cv2.imencode(".jpg", frame)
        frame_bytes = buffer.tobytes()

        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
        )

    cap.release()

# ------------------ VIDEO FEED ROUTE ------------------

@app.route("/video_feed")
def video_feed():
    return Response(
        generate_frames(),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )

# ------------------ RUN APP ------------------

if __name__ == "__main__":
    app.run(debug=True)

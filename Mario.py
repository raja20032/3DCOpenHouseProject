# You can any game like mario, adventure island, contra etc.

import tensorflow as tf
import cv2
import multiprocessing as mp
from utils import load_graph, detect_hands, predict
from utils import ORANGE, RED, GREEN
from pyKey import pressKey, releaseKey, press 
import keyboard
import webbrowser
from flask import Flask, render_template, Response


global capture,rec_frame, grey, switch, neg, face, rec, out 
capture=0
grey=0
neg=0
face=0
switch=1
rec=0

app = Flask(__name__ ,template_folder='./templates')

camera = cv2.VideoCapture(0) 

def record(out):
    global rec_frame
    while(rec):
        time.sleep(0.05)
        out.write(rec_frame)


def detect_face(frame):
    global net
    (h, w) = frame.shape[:2]
    blob = cv2.dnn.blobFromImage(cv2.resize(frame, (300, 300)), 1.0,
        (300, 300), (104.0, 177.0, 123.0))   
    net.setInput(blob)
    detections = net.forward()
    confidence = detections[0, 0, 0, 2]

    if confidence < 0.5:            
            return frame           

    box = detections[0, 0, 0, 3:7] * np.array([w, h, w, h])
    (startX, startY, endX, endY) = box.astype("int")
    try:
        frame=frame[startY:endY, startX:endX]
        (h, w) = frame.shape[:2]
        r = 480 / float(h)
        dim = ( int(w * r), 480)
        frame=cv2.resize(frame,dim)
    except Exception as e:
        pass
    return frame

width = 640
height = 480
threshold = 0.6
alpha = 0.3
pre_trained_model_path = "model/pretrained_model.pb"

@app.route('/')
def index():
    """Video streaming home page."""
    return render_template('index.html')

def main():
    '''webbrowser.open_new("https://supermario-game.com/")'''


    graph, sess = load_graph(pre_trained_model_path)
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
    qmp = mp.get_context("spawn")
    v = mp.Value('i', 0)
    lock = mp.Lock()

    while True:
        key = cv2.waitKey(10)
        if key == ord("q"):
            break
        _, frame = cap.read()

        cv2.imwrite('t.jpg', frame)
        yield (b'--frame\r\n'
        b'Content-Type: image/jpeg\r\n\r\n' + open('t.jpg', 'rb').read() + b'\r\n')
        
        frame = cv2.flip(frame, 1)
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        boxes, scores, classes = detect_hands(frame, graph, sess)
        frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
        results = predict(boxes, scores, classes, threshold, width, height)

        if len(results) == 1:
            x_min, x_max, y_min, y_max, category = results[0]
            x = int((x_min + x_max) / 2)
            y = int((y_min + y_max) / 2)
            cv2.circle(frame, (x, y), 5, RED, -1)

            if category == "Open" and x <= width / 3:
                action = 7  # Left jump
                text = "Jump left"
                releaseKey("LEFT")
                press('LEFT', 0.15)
                pressKey("UP")
                
            elif category == "Closed" and x <= width / 3:
                action = 6  # Left
                text = "Run left"
                releaseKey('UP')
                pressKey("LEFT")
                
            elif category == "Open" and width / 3 < x <= 2 * width / 3:
                action = 5  # Jump
                releaseKey('LEFT')
                releaseKey("RIGHT")
                pressKey("UP")
                text = "Jump"
               
            elif category == "Closed" and width / 3 < x <= 2 * width / 3:
                action = 0  # Do nothing
                releaseKey('LEFT')
                releaseKey("RIGHT")
                releaseKey('UP')
                keyboard.press_and_release('shift')
                text = "Stay"
                
            elif category == "Open" and x > 2 * width / 3:
                action = 2  # Right jump
                text = "Jump right"
                releaseKey("RIGHT")
                press("RIGHT", 0.15)
                pressKey('UP')
                
            elif category == "Closed" and x > 2 * width / 3:
                action = 1  # Right
                text = "Run right"
                releaseKey("UP")
                pressKey(key = 'RIGHT')
                
            else:
                action = 0
                text = "Stay"
            
            with lock:
                v.value = action
            
            cv2.putText(frame, "{}".format(text), (x_min, y_min - 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, GREEN, 2)
               
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (int(width / 3), height), ORANGE, -1)
        cv2.rectangle(overlay, (int(2 * width / 3), 0), (width, height), ORANGE, -1)
        cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)
        cv2.imshow('Detection', frame)

    cap.release()
    cv2.destroyAllWindows()


@app.route('/video_feed')
def video_feed():
    """Video streaming route. Put this in the src attribute of an img tag."""
    '''return Response(gen_frames(),
                   mimetype='multipart/x-mixed-replace; boundary=frame')'''
    return Response(main(), mimetype='multipart/x-mixed-replace; boundary=frame')


if __name__ == '__main__':
    main()
    app.run()

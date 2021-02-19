import { useRef, useEffect } from 'react';
import * as tf from "@tensorflow/tfjs";

export function normalizeData(data, axis = 0) {
  let X = data;
  let vmin = X.min(axis, true);
  let vmax = X.max(axis, true);
  X = tf.div(tf.sub(X, vmin), tf.sub(vmax, vmin));
  return X;
}

export function resizeCanvas(canvas) {
  const { width, height } = canvas.getBoundingClientRect();
  if (canvas.width !== width || canvas.height !== height) {
    const { devicePixelRatio: ratio = 1 } = window;
    const context = canvas.getContext('2d');
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.scale(ratio, ratio);
    return true;
  }
  return false;
}

function _postdraw(context, canvas) {
  context.restore();
}

function _predraw(context, canvas) {
  context.save();
  // resizeCanvas(canvas)
  const { width, height } = context.canvas;
  context.clearRect(0, 0, width, height);
}

function _draw(context, canvas) {

}

export const AnimatedCanvas = (props) => {

  const canvasRef = useRef(null);
  const { draw = _draw,
    predraw = _predraw,
    postdraw = _postdraw,
    fps = 20, ...rest } = props;
  let start = window.performance.now();
  const interval = 1000. / fps;

  useEffect(() => {

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    let frameCount = 0;
    let animationFrameId;

    //Our draw came here
    const render = () => {
      frameCount++;
      const now = window.performance.now();
      if (now - start > interval) {
        start = now;
        predraw(context, canvas);
        draw(context, canvas, frameCount);
        postdraw(context, canvas);
      }
      animationFrameId = window.requestAnimationFrame(render);
    };
    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [draw]);

  return <canvas ref={canvasRef} {...rest} />;
};

export const Canvas = (props) => {
  const ref = useRef(null);
  const { draw = _draw, ...rest } = props;

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas.getContext('2d');
    draw(context, canvas);
    return () => {
    };
  }, [draw]);

  return <canvas ref={ref} {...rest} />;
};


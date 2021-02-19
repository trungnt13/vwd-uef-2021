import logo from './logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import React, { Component, useRef, useEffect } from 'react';
import test_tfjs from './models';
import * as d3 from 'd3';
import { Canvas, AnimatedCanvas, normalizeData, resizeCanvas } from './Canvas';
import * as tf from "@tensorflow/tfjs";
import { ToggleButton, Button } from "react-bootstrap";


class DataSelector extends Component {
  constructor(args) {
    super(args);

    const random = d3.randomNormal(0, 0.2);
    const sqrt3 = Math.sqrt(3);
    this.data = tf.tensor([].concat(
      Array.from({ length: 300 }, () => [random() + sqrt3, random() + 1]),
      Array.from({ length: 300 }, () => [random() - sqrt3, random() + 1]),
      Array.from({ length: 300 }, () => [random(), random() - 1])
    ));

    this.draw = this.draw.bind(this);
    this.draw_points = this.draw_points.bind(this);
  }

  draw(ctx, frameCount) {
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(50, 100, 20 * Math.sin(frameCount * 0.05) ** 2, 0, 2 * Math.PI);
    ctx.fill();
  }

  draw_points(ctx, canvas) {
    ctx.save();
    ctx.fillStyle = 'red';
    let X = normalizeData(this.data);
    let width = canvas.width;
    let height = canvas.height;
    ctx.scale(width, height);
    for (let xy of X.unstack()) {
      let [x, y] = xy.dataSync();
      ctx.beginPath();
      ctx.arc(x, 1. - y, 0.03, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.restore();
  }

  render() {
    return (
      <div id="data-menu">
        <div className="demo-data selected">
          <AnimatedCanvas width="200" height="200" draw={this.draw} />
          <span>Grid</span>
        </div>
        <div className="demo-data">
          <Canvas width="200" height="200" draw={this.draw_points} />
          <span>Grid</span>
        </div>
      </div>
    );
  }
}


class DataVisual extends Component {
  constructor(props) {
    super(props);
    this.state = { animating: true, data: tf.zeros([100, 2]) };
    this.draw = this.draw.bind(this);
  }

  componentDidMount() {
    DataVisual.switch = DataVisual.switch.bind(this);
  }

  static switch(command) {
    if (command === 'animating') {
      this.setState(state => ({ animating: !state.animating, data: state.data }));
    } else if (command === 'reset') {
      this.setState(state => ({ animating: state.animating, data: tf.zeros(state.data.shape) }));
    }
  }

  draw(ctx, canvas, frameCount) {
    resizeCanvas(canvas);
    ctx.save();
    let data = this.state.data;
    if (this.state.animating) {
      data = data.add(tf.randomNormal(data.shape).mul(5));
    }
    const { width, height } = canvas.getBoundingClientRect();
    ctx.translate(width / 2, height / 2);
    for (let xy of data.unstack()) {
      const [x, y] = xy.dataSync();
      ctx.fillStyle = (Math.abs(x) > width / 4 ||
        Math.abs(y) > height / 4) ? 'red' : 'blue';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.restore();
    if (this.state.animating) {
      let xabs = data.abs();
      data = tf.where(
        tf.logicalOr(xabs.less(width / 2), xabs.less(height / 2)),
        data, 0);
    }
    this.state.data = data;
  }

  render() {
    return (
      <div id="playground-canvas">
        <AnimatedCanvas width="600" height="600"
          draw={this.draw} fps="20" />
      </div>
    );
  }
}


class UIControl extends Component {
  constructor(props) {
    super(props);
    this.state = { start: true };
    this.handlePlay = this.handlePlay.bind(this);
  }

  componentDidMount() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const dest = this.audioCtx.createMediaStreamDestination();
    this.mediaRecorder = new MediaRecorder(dest.stream);
    this.mediaRecorder.ondataavailable = (evt) => {
      console.log(evt.data)
    };

    this.gain = this.audioCtx.createGain();
    // this.audioCtx.destination
    this.gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
    this.gain.connect(dest);
  }

  componentWillUnmount() {
    this.audioCtx.close();
  }

  handlePlay(event) {
    if (event.target.id === 'start') {
      DataVisual.switch('animating');
      this.setState({
        play: !this.state.start
      });
    } else if (event.target.id === 'reset') {
      DataVisual.switch('reset');
    } else if (event.target.id === 'play') {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const duration = 0.5;
      var osc = this.audioCtx.createOscillator();
      var gainNode = this.audioCtx.createGain();
      gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(1, this.audioCtx.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + duration);
      osc.type = "triangle";
      osc.frequency.value = 100;
      this.mediaRecorder.start();
      osc.start(this.audioCtx.currentTime);
      // sound will stop in 1 seconds
      osc.stop(this.audioCtx.currentTime + duration);
      osc.connect(gainNode);
      gainNode.connect(this.gain);
      this.mediaRecorder.stop(duration);
    }
  }


  componentDidUpdate() {

  }

  render() {
    return (
      <div id='data-details'>
        <Button id="start" variant="primary" onClick={this.handlePlay}>
          {this.state.start ? 'Stop' : 'Start'}
        </Button> {' '}
        <Button id="reset" variant="primary" onClick={this.handlePlay}>
          Reset
        </Button> {' '}
        <Button id="play" variant="primary" onClick={this.handlePlay}>
          Audio
        </Button>
      </div>
    );
  }
}

export class App extends Component {
  render() {
    return (
      <div id='playground'>
        <DataVisual />
        <DataSelector />
        <UIControl />
      </div>
    );
  }
}

export default App;

import { Component } from 'react';

/** Falls back to `fallback` if WebGL or a model fails: the page must never white-screen. Kept in its own tiny
 *  module so importing it does not drag three.js / react-three-fiber into every page. */
export default class ViewerBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.warn('[3d] viewer failed, showing fallback:', error?.message);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

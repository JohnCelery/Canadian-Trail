export class Sprite {
  constructor(img, meta) {
    this.img = img;
    this.meta = meta;
    this.placeholder = meta.placeholder || false;
    this.frame = 0;
    this.acc = 0;
  }

  update(dt) {
    const frameTime = 1000 / (this.meta.fps || 1);
    this.acc += dt;
    while (this.acc >= frameTime) {
      this.acc -= frameTime;
      this.frame = (this.frame + 1) % this.meta.frames;
    }
  }

  draw(ctx, x, y) {
    ctx.imageSmoothingEnabled = false;
    const fw = this.meta.frameWidth;
    const fh = this.meta.frameHeight;
    const sx = this.frame * fw;
    ctx.drawImage(this.img, sx, 0, fw, fh, x, y, fw, fh);
    if (this.placeholder) {
      ctx.strokeStyle = 'rgba(255,0,0,0.4)';
      ctx.strokeRect(Math.floor(x) + 0.5, Math.floor(y) + 0.5, fw - 1, fh - 1);
    }
  }
}

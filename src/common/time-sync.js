export default class TimeSync {
  constructor() {
    this.minOffset = Number.NEGATIVE_INFINITY;
    this.maxOffset = Number.POSITIVE_INFINITY;
  }

  update(local, remote, laterLocal) {
    const thisMinOffset = remote - laterLocal;
    const thisMaxOffset = remote - local;

    // Update min and max offset
    this.minOffset = Math.max(this.minOffset, thisMinOffset);
    this.maxOffset = Math.min(this.maxOffset, thisMaxOffset);
    this.certainty = this.maxOffset - this.minOffset;

    this.offset = Math.floor(this.minOffset + (this.certainty / 2));
    return this.offset;
  }
}

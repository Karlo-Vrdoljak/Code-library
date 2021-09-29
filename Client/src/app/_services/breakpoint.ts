export class Breakpoint {
  private _breakpoint = {
    xxs: 335,
    xs: 448,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1440,
    '3xl': 1600,
  };
  public get breakpoint() {
    return this._breakpoint;
  }
  public set breakpoint(value) {
    this._breakpoint = value;
  }

  constructor() {}

  responsiveAmount(key: string) {
    switch (key) {
      case 'xxs':
        return 0;
      case 'xs':
        return 0
      case 'sm':
        return 1;
      case 'md':
        return 2;
      case 'lg':
        return 3;
      case 'xl':
        return 5;
      case '2xl':
        return 9;
      case '3xl':
        return 25;
      default:
        return 25;
    }
  }
  public findBreakpoint(size: number) {
    const bp = Object.keys(this.breakpoint).find((key) => this.breakpoint[key] >= size);
    return bp ? bp: '2xl';
  }
}

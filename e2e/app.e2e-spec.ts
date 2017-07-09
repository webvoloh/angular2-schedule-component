import { PercoIntervalsPage } from './app.po';

describe('perco-intervals App', () => {
  let page: PercoIntervalsPage;

  beforeEach(() => {
    page = new PercoIntervalsPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});

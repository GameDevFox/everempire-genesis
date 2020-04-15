import DeltaView from './delta-view';

describe('DeltaView', () => {
  it('should be able to initialize data', () => {
    const deltaView = DeltaView({ name: 'James', gold: '100' });
    deltaView.data.should.eql({ name: 'James', gold: '100' });
  });

  describe('enter(data)', () => {
    it('should add data to the view', () => {
      const deltaView = DeltaView();
      deltaView.data.should.eql({});

      deltaView.enter({
        msg: 'hello',
        gold: 1000,
        list: [1, 2, 3],
        players: {
          1: { name: 'James', hp: 100 },
          2: { name: 'Sarah', hp: 80 },
        },
      });

      deltaView.data.should.eql({
        msg: 'hello',
        gold: 1000,
        list: [1, 2, 3],
        players: {
          1: { name: 'James', hp: 100 },
          2: { name: 'Sarah', hp: 80 },
        },
      });

      deltaView.enter({
        msg: 'goodbye',
        another: 'one',
        list: [4, 5, 6],
        players: {
          1: { hp: 120 },
          2: { mp: 30 },
          3: { name: 'Alex', hp: 100 },
        },
      });

      deltaView.data.should.eql({
        msg: 'goodbye',
        gold: 1000,
        another: 'one',
        list: [4, 5, 6],
        players: {
          1: { name: 'James', hp: 120 },
          2: { name: 'Sarah', hp: 80, mp: 30 },
          3: { name: 'Alex', hp: 100 },
        },
      });
    });

    it('should fire an event', done => {
      const enterData = {
        hello: 'world',
        gold: 123,
      };

      const deltaView = DeltaView();
      deltaView.on('enter', data => {
        data.should.eql(enterData);
        done();
      });

      deltaView.enter(enterData);
    });
  });

  describe('exit(paths)', () => {
    it('should remove data from the view', () => {
      const deltaView = DeltaView({
        msg: 'goodbye',
        gold: 1000,
        another: 'one',
        list: [4, 5, 6],
        players: {
          1: { name: 'James', hp: 120 },
          2: { name: 'Sarah', hp: 80, mp: 30 },
          3: { name: 'Alex', hp: 100 },
        },
      });

      deltaView.exit([
        'msg',
        'gold',
        'list',
        {
          players: [
            1,
            { 2: ['hp'] },
          ],
        },
      ]);

      deltaView.data.should.eql({
        another: 'one',
        players: {
          2: { name: 'Sarah', mp: 30 },
          3: { name: 'Alex', hp: 100 },
        },
      });
    });

    it('should fire an event', done => {
      const exitPaths = ['one', 'two', 'last'];

      const deltaView = DeltaView();
      deltaView.on('exit', paths => {
        paths.should.eql(exitPaths);
        done();
      });

      deltaView.exit(exitPaths);
    });
  });
});

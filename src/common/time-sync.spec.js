import TimeSync from './time-sync';

describe('TimeSync', () => {
  it('should estimate the offset between local and remote locations', () => {
    const timeSync = new TimeSync();

    timeSync.update(1234, 2000, 3567);
    timeSync.offset.should.equal(-401);
    timeSync.certainty.should.equal(2333);

    timeSync.update(5100, 5200, 5250);
    timeSync.offset.should.equal(25);
    timeSync.certainty.should.equal(150);

    timeSync.update(6012, 6030, 6045);
    timeSync.offset.should.equal(1);
    timeSync.certainty.should.equal(33);
  });
});

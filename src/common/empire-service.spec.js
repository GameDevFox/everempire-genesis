import sinon from 'sinon';

import EmpireService from './empire-service';

describe('EmpireService', () => {
  it('should automatically build functions that call the provided restService', () => {
    const restService = { call: sinon.spy() };

    const empireService = EmpireService(restService);
    empireService.destroyWorld(123);

    restService.call.firstCall.args.should.eql(['DELETE', '/me/world/123', undefined, undefined]);
  });
});

import ArrayTemplate from './array-template';

describe('ArrayTemplate', () => {
  it('should take a list of options instead of an object', () => {
    // eslint-disable-next-line no-template-curly-in-string
    const template = ArrayTemplate('Hello ${prop} I am ${another} the ${last} template');
    const msg = template(['one', '2', 3]);
    msg.should.equal('Hello one I am 2 the 3 template');
  });
});

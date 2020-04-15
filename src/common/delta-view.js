import _ from 'lodash';
import EventEmitter from 'events';

export default function DeltaView(data = {}) {
  const result = new EventEmitter();

  const enter = enterData => {
    result.data = _.merge(data, enterData);
    result.emit('enter', enterData);
  };

  const removePaths = (data, paths) => {
    paths.forEach(path => {
      if(_.isObject(path)) {
        _.each(path, (subPaths, key) => {
          const subData = data[key];
          removePaths(subData, subPaths);
        });
      } else
        delete data[path];
    });
  };

  const exit = paths => {
    removePaths(result.data, paths);
    result.emit('exit', paths);
  };

  return _.merge(result, {
    data,
    enter,
    exit,
  });
}

import _ from 'lodash';

function getVars(path) {
  const result = [];

  let regex;
  let offset = 0;
  while(true) { // eslint-disable-line no-constant-condition
    regex = path.substring(offset).match(/\${([^}]*)}/);

    if(!regex)
      break;

    result.push(regex[1]);
    offset += regex.index + 1;
  }

  return result;
}

function buildTemplateData(args, values) {
  const result = {};
  _.each(args, (variable, index) => {
    result[variable] = values[index];
  });
  return result;
}

function ArrayTemplate(template) {
  const compiled = _.template(template);
  const vars = getVars(template);

  const result = function(args) {
    const data = buildTemplateData(vars, args);
    return compiled(data);
  };

  result.argCount = vars.length;

  return result;
}

export default ArrayTemplate;

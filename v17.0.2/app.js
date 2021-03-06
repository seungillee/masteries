'use strict;';


function getTranslations(locale) {
  return new Promise(function (resolve, reject) {
    $.ajax('locale.' + locale + '.json', {
      success: function (data, textStatus, jqXHR) {
        resolve(data);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.log("Unable to load translation file for locale " + locale, errorThrown);
        resolve(null);
      },
    });
  });
}

function createView(rank) {
  var view = {};
  Object.keys(rank).forEach(function (key) {
      view[key] = '<span class="variable">' + rank[key] + '</span>';
    });
  return view;
}

function applyTranslations() {
  Object.keys(translations.masteries).forEach(function (name) {
    var translation = translations.masteries[name],
      $mastery = $('#' + name);

    $mastery.data('label', translation.label);
    $mastery.data('description', translation.description);

  });

  $('#help').text(translations.help);
}

function restoreState() {
  var hash = location.hash;
  if (!hash) return;
  var digits = hash.substr(1).split('');
  digits.forEach(function (rank, index) {
    masteries[index].rank = parseInt(rank, 10);
  });
}

function attachMastery(configObject, $container) {
  var $mastery = $('<div class="mastery icon-' + configObject.name + '">');
  $mastery
    .appendTo($container)
    .css('left', configObject.xpos * 52 + 20)
    .css('top', configObject.ypos * 36 + 20)
    .attr('id', configObject.name)
    .data('config', configObject)
    .data('rank', configObject.rank || 0)
    .addClass(configObject.style)
    .on('click', handleClick);
  configObject.element = $mastery;
}

function setMasteryValue($mastery, rank) {
  var max = $mastery.data('config').max,
    text = rank + '/' + max,
    className = rank ? (rank === max ? 'max' : 'notnull') : '',
    configObject = $mastery.data('config');

  $mastery
    .data('rank', rank)
    .removeClass('notnull')
    .removeClass('max')
    .addClass(className)
    .empty()
    .append($('<span class="rank">').text(text).on('click', function (event) {
      setMasteryValue($(this).parent(), 0);
      defineHash();
      event.stopPropagation();
    }))
    .append($('<span class="help">?</span>').on('click', function (event) {
      event.stopPropagation();
    }))
  ;

  var view = createView(rank ? configObject.ranks[rank - 1] : 0);
  var text = Mustache.render($mastery.data('description'), view);

  $mastery.find('.help').qtip({
    content: {
      title: $mastery.data('label'),
      text: text,
    },
    position: {
      my: 'bottom center',
      at: 'top center',
    },
    style: 'qtip-jtools ' + className,
  });
}

function handleClick(event) {
  var $mastery = $(this), rank = $mastery.data('rank');
  if (event.ctrlKey || event.shiftKey) {
    rank--;
  } else {
    rank++;
  }
  rank = Math.max(rank, 0);
  rank = Math.min(rank, $mastery.data('config').max);
  setMasteryValue($mastery, rank);
  defineHash();
}

function defineHash() {
  location.hash = masteries.map(function (mastery) {
    return mastery.element.data('rank');
  }).join('');
  var spent = 0, types = [];
  masteries.forEach(function (mastery) {
    spent += mastery.element.data('rank');
    types[mastery.type] = (types[mastery.type] || 0) + mastery.element.data('rank');
  });
  $('#spent').text(spent + ' ' + translations.spent);
  $('#spent')[spent > 59 ? 'addClass' : 'removeClass']('overspent');
  var typeNames = ['offensive', 'defensive', 'utility'];
  types.forEach(function (points, type) {
    $('[data-type="' + type + '"] .points').text(translations[typeNames[type]] + " (" + points + ")");
  });
}

function buildUI() {
  for (var type = 0; type < 3; type++) {
    buildPane(type);
  }
}

function buildPane(type) {
  var $container = $('.container[data-type="' + type + '"]');
  masteries.filter(function (mastery) {
    return mastery.type === type;
  }).forEach(function (mastery) {
    attachMastery(mastery, $container);
  });
  var $points = $container.find('.points');
}

function initMasteries() {
  $('div.mastery').each(function (index, element) {
    var $mastery = $(element);
    setMasteryValue($mastery, $mastery.data('rank') || 0);
  });
}

$(function () {

  restoreState();

  var supportedLocales = ['en', 'fr'],
    locale = 'en';
  if (supportedLocales.indexOf(window.navigator.language) > -1) locale = window.navigator.language;

  getTranslations(locale)
    .then(function (result) {
      translations = result;
      buildUI();
      applyTranslations();
      initMasteries();
      defineHash();
    });
});

var translations;

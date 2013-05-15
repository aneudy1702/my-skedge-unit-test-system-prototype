/**
 * @param {!Object} data The Thing represented by this list item.
 * @param {function(!number, !boolean):?} icb Internal callback on selection.
 * @return {!ModulerInterface} Interface for list item.
 */
modules.BookingMenuListItem = function(data, icb) {
  var li = new Moduler({selected: false, enabled: true, data: data}, 'li', function(d, e) {
    if (d.selected === true) { e.addClass('active'); }
    else { e.removeClass('active'); }
    if (d.enabled === true) { e.removeClass('disabled'); }
    else { e.addClass('disabled'); }
    return '';
  });
  li.createChild(data, 'a href="#"', function(d) {
    return d.name;
  });
  li.onClick(function() {
    if (li.data().enabled) {
      if (!li.data().selected) {
        li.setData({selected: true, enabled: true, data: data});
      }
      else {
        li.setData({selected: false, enabled: true, data: data});
      }
      icb(data.id, li.data().selected);
    }
  });
  return li.getInterface();
};
/* For testing:
var m = modules.BookingMenuListItem({tid: 1, id: 1, name: 'Calvin'}, function(d){ console.log(d); })
$('body').append(m.html())
*/

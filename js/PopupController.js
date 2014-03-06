
(function($) {

  var PopupController = function() {
  
  }
  
  PopupController.prototype.start = function() {
    this.registerTabs();
    this.registerEvents();
  }
  
  PopupController.prototype.registerEvents = function() {
    $('.btn.analyze').click(function(e) {
      $(this).prop('disabled', true);
      that.analyzePage();
    });
    
    var that = this;
    chrome.runtime.onMessage.addListener(function(res, sender, sendResponse) {
      //if (res.action == 'finished') {
        that.fillPage(res.results);
      //}
    });
  }
  
  PopupController.prototype.fillPage = function(results) {
    console.log(results);
    this.fillSection('css', results);
    this.fillSection('javascript', results);
    this.fillSection('links', results);
    this.fillSection('images', results);
  }
  
  PopupController.prototype.fillSection = function(type, results) {
    var count = 0;
    var list = false;
    
    if (results.passes[type]) {
      list = $('.successes .' + type + '-results-list');
      for (var i in results.passes[type]) {
        list.append($('<li>').text(results.passes[type][i]));
        count++;
      }
      $('.' + type + '-results .badge.success').text(count);
    }
  
    if (results.fails[type]) {
      count = 0;
      list = $('.failures .' + type + '-results-list');
      for (var i in results.fails[type]) {
        list.append($('<li>').text(results.fails[type][i]));
        count++;
      }
      $('.' + type + '-results .badge.failures').text(count);
    }
  }
  
  PopupController.prototype.analyzePage = function(event) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'analyze' }, function(res) {
        console.log("PageCrawler", "Recieved page analysis");
        $('.btn.analyze').removeAttr('disabled');
      });
    });
  }
  
  PopupController.prototype.registerTabs = function() {
    $('.tab-thumb').click(function(e) {
      var id = $(this).data('id');
      $('.tab-content > .tab').each(function() {
        console.log('comparing', $(this).data('id'), id);
        if ($(this).data('id') == id) {
          $(this).removeClass('hide');
        } else {
          $(this).addClass('hide');
        }
      });
      $('.tab-thumb.active').removeClass('active');
      $(this).addClass('active');
    });
  }
  
  $(document).ready(function() {
    var controller = new PopupController();
    controller.start();
  });
  
})(window.jQuery);

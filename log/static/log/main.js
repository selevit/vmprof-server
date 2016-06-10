
app.directive('hoverVars', function($timeout){
  return {
    'link': function(scope, element, attrs) {
      scope.$on('trace-update', function() {
        // need the timeout, otherwise the wrong variables
        // will be selected
        $timeout(function(){
          JitLog.hoverVars.call(this, scope)
        });
      });
    }
  }
});

app.directive('traceForest', function($timeout){
  return {
    'link': function(scope, element, attrs) {
      scope.$on('trace-init', function() {
        trace_forest = new TraceForest(jitlog)
        trace_forest.setup_once('#forest');
      })
    }
  }
});

app.directive('liveRange', function(){
  return {
    'link': function(scope, element, attrs) {
      var jelem = jQuery(element);
      var column = parseInt(jelem.data('column'));
      var index = scope.$index;
      scope.$on('live-range-' + column, function(e, from, to, color) {
        if (from <= index && index <= to) {
          jelem.css('background-color', color);
          if (color == '') {
            jelem.height(1);
          } else {
            var jparent = jelem.parent();
            var height = jparent.parent().first().height();
            jelem.height(height);
            jparent.height(height);
          }
        }
      })
    }
  }
});

app.controller('jit-trace-forest', function ($scope, $http, $routeParams, $timeout,
                                    $location, $localStorage) {
    // variable defaults
    $scope.$storage = $localStorage.$default({
      filter_loop: true,
      filter_bridge: false,
      show_asm: true,
      show_source_code: true,
    })
    $scope.live_ranges = { 8: { 0: {'background-color': 'green', 'height': '20px', 'width': '2px'}} }
    $scope.loading = new Loading($scope)
    $scope.ops = []
    $scope.trace_type = 'asm'
    $scope.selected_trace = null;
    var lh = $scope.$storage.last_trace_hash
    if (lh !== $scope.$storage.last_trace_hash) {
      $scope.$storage.last_trace_id = null
    }
    $scope.$storage.last_trace_hash = $routeParams.log

    jitlog = new JitLog();
    jitlog.checksum = $routeParams.log
    $scope.jitlog = jitlog

    $http.get('/api/log/meta/' + $routeParams.log + '/', {
        cache: true
    }).then(function(response) {
      jitlog.set_meta(response.data)
      //$scope.meta = response.data

      //$scope.log = response.data;
      jitlog.trace_type = $scope.trace_type
      $scope.traces = jitlog.filter_traces("", true, false)

      var last_id = $scope.$storage.last_trace_id
      var trace = jitlog.get_trace_by_id(last_id)
      if (last_id && trace) {
        $timeout(function(){
          $scope.switch_trace(trace, $scope.trace_type)
        })
      }

      $timeout(function(){
        $scope.$broadcast('trace-init')
        $scope.$broadcast('trace-update')
      })
      $scope.loading.stop()
    });

    $scope.switch_trace = function(trace, type, asm) {
      $scope.trace_type = type
      jitlog.trace_type = type
      //
      $scope.show_asm = asm
      //
      if (!$scope.loading.complete()) { return; }
      $scope.loading.start("trace")
      JitLog.resetState()
      $scope.selected_trace = null
      //
      $scope.$storage.last_trace_id = trace.get_id()
      $http.get('/api/log/trace/' + jitlog.checksum + "/?id=" + trace.get_id(), {
          cache: true
      }).then(function(response) {
        // set the new type and the subject trace
        trace.set_data(response.data)
        $scope.selected_trace = trace
        $timeout(function(){
          $scope.$broadcast('trace-update')
        })
        $scope.loading.stop()
      })

      $http.get('/api/log/stitches/' + jitlog.checksum + "/?id=" + trace.get_id(), {
          cache: true
      }).then(function(response) {
        // set the new type and the subject trace
        var visual_trace = response.data
        trace_forest.display_tree($scope, trace, visual_trace)
        $scope.loading.stop()
      })
    }

    $scope.filter_traces = function(text, loops, bridges) {
      if (!text){ text = ""; }
      //
      var type = "none"
      if (loops && bridges) { var type = "both" }
      else if (loops) { var type = "loop" }
      else if (bridges) { var type = "bridge" }
      //
      return jitlog.filter_traces(text, type)
    }
});

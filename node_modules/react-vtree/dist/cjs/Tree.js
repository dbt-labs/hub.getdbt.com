"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = exports.createTreeComputer = exports.Row = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _react = _interopRequireWildcard(require("react"));

var _reactMergeRefs = _interopRequireDefault(require("react-merge-refs"));

var _utils = require("./utils");

/* eslint-disable no-labels,max-depth,complexity */
// eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/prefer-readonly-parameter-types
var Row = function Row(_ref) {
  var index = _ref.index,
      _ref$data = _ref.data,
      Node = _ref$data.component,
      getRecordData = _ref$data.getRecordData,
      treeData = _ref$data.treeData,
      style = _ref.style,
      isScrolling = _ref.isScrolling;
  var data = getRecordData(index);
  return /*#__PURE__*/_react.default.createElement(Node, Object.assign({
    isScrolling: isScrolling,
    style: style,
    treeData: treeData
  }, data));
};

exports.Row = Row;

// If refresh is required, we will run the TreeWalker. It will completely
// update all requests and reset every state to default.
var generateNewTree = function generateNewTree(_ref2, _ref3, state) {
  var createRecord = _ref2.createRecord;
  var buildingTaskTimeout = _ref3.buildingTaskTimeout,
      placeholder = _ref3.placeholder,
      _ref3$async = _ref3.async,
      async = _ref3$async === void 0 ? false : _ref3$async,
      treeWalker = _ref3.treeWalker;
  var shouldPreservePreviousState = // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  async && state.records !== undefined;
  var previousRecords = state.records;
  var order = [];
  var records = new Map();
  var requestIdleCallbackOptions = buildingTaskTimeout ? {
    timeout: buildingTaskTimeout
  } : undefined;
  var meta = new WeakMap();
  var iter = treeWalker();

  var _iter$next = iter.next(),
      root = _iter$next.value; // Each record has a link to a parent, the next sibling and the next child.
  // Having this info, we can perform a depth-first traverse.


  var rootRecord = createRecord(root.data, state, undefined, shouldPreservePreviousState ? previousRecords.get(root.data.id) : undefined);
  records.set(rootRecord.public.data.id, rootRecord);
  meta.set(rootRecord, root);
  var currentRecord = rootRecord;
  var isTraversingRoot = true;
  var tempRecord = rootRecord;
  var useIdleCallback = typeof 'requestIdleCallback' !== 'undefined' && placeholder !== undefined && // If placeholder is set to null and this is the first build, idle callback
  // won't be used. It is necessary for trees with async data which can be
  // extremely complex but the first build is quite easy. During the following
  // idle callbacks the old tree will be shown.
  !(placeholder === null && !state.order);
  var hasTime = useIdleCallback ? function (deadline) {
    return deadline.timeRemaining() > 0;
  } : function () {
    return true;
  };

  var task = function task(deadline) {
    while (currentRecord !== null) {
      if (!hasTime(deadline)) {
        requestIdleCallback(task, requestIdleCallbackOptions);
        return;
      }

      if (!currentRecord.visited) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        var _iter$next2 = iter.next(meta.get(currentRecord)),
            child = _iter$next2.value; // When the generator returns the undefined value we consider that all
        // children are already sent and we need to select the new parent
        // element to get its children.


        if (child === undefined) {
          if (isTraversingRoot) {
            isTraversingRoot = false;
          } else {
            if (currentRecord.isShown) {
              order.push(currentRecord.public.data.id);
            }

            currentRecord.visited = currentRecord.child !== null;
            currentRecord = currentRecord.child !== null ? currentRecord.child : currentRecord.sibling !== null ? currentRecord.sibling : currentRecord.parent;
          }

          tempRecord = currentRecord;
          continue;
        }

        var childRecord = createRecord(child.data, state, isTraversingRoot ? undefined : currentRecord, shouldPreservePreviousState ? previousRecords.get(child.data.id) : undefined);
        records.set(childRecord.public.data.id, childRecord);
        meta.set(childRecord, child);

        if (!isTraversingRoot && tempRecord === currentRecord) {
          tempRecord.child = childRecord;
        } else {
          tempRecord.sibling = childRecord;
        }

        tempRecord = childRecord;
      } else {
        currentRecord.visited = false;
        currentRecord = currentRecord.sibling !== null ? currentRecord.sibling : currentRecord.parent;
        tempRecord = currentRecord;
      }
    }

    if (useIdleCallback) {
      state.setState({
        order: order,
        records: records,
        updateRequest: {}
      });
    }
  };

  if (useIdleCallback) {
    requestIdleCallback(task, requestIdleCallbackOptions);
  } else {
    task();
  } // If we want to preserve the previous state and use the requestIdleCallback,
  // we need to return the old state.


  return placeholder !== undefined && async && state.order ? state : {
    order: order,
    records: records
  };
};

var MAX_FUNCTION_ARGUMENTS = 32768;
var SPLICE_DEFAULT_ARGUMENTS_NUMBER = 2; // If we need to perform only the update, treeWalker won't be used. Update will
// work internally, traversing only the subtree of elements that require
// update through the opennessState option.

var updateExistingTree = function updateExistingTree(_ref4, _ref5) {
  var order = _ref4.order,
      records = _ref4.records;
  var opennessState = _ref5.opennessState;

  if (typeof opennessState !== 'object') {
    return null;
  }

  for (var id in opennessState) {
    if (!records.has(id)) {
      continue;
    }

    var opts = opennessState[id];
    var ownerRecord = records.get(id); // Here we unify the shape of openness state options

    var _ref6 = typeof opts === 'boolean' ? {
      open: opts
    } : opts,
        open = _ref6.open,
        _ref6$subtreeCallback = _ref6.subtreeCallback,
        subtreeCallback = _ref6$subtreeCallback === void 0 ? _utils.noop : _ref6$subtreeCallback;

    var update = _utils.noop;
    var apply = _utils.noop;

    if (ownerRecord.isShown) {
      if (open) {
        (function () {
          // If received rules require us to open the subtree, we have 2 cases:
          // 1. The node is not opened yet. In this case we simply have to
          // calculate and add new ids.
          // 2. The node is opened already. In this case we have to remove all
          // existing ids and replace them with new ids.
          var index = order.indexOf(id); // Here we calculate a count of visible subtree nodes to remove from
          // `order`. Then we will replace the gap with the updated list of
          // subtree nodes.

          var recordNextToSubtree = ownerRecord;

          while (recordNextToSubtree !== null) {
            if (recordNextToSubtree.sibling !== null) {
              recordNextToSubtree = recordNextToSubtree.sibling;
              break;
            }

            recordNextToSubtree = recordNextToSubtree.parent;
          }

          var countToRemove = recordNextToSubtree === null ? order.length - 1 - index : order.indexOf(recordNextToSubtree.public.data.id) - 1 - index;
          var orderParts = [[index + 1, countToRemove]]; // Unfortunately, splice cannot work with big arrays. If array exceeds
          // some length it may fire an exception. The length is specific for
          // each engine; e.g., MDN says about 65536 for Webkit. So, to avoid this
          // overflow, I split `order` parts to chunks by 32768 elements in each
          // one. These chunks will be sent as arguments to the `splice` method.
          //
          // To avoid array concatenations which may cause Major GC, I set two
          // first arguments as `splice`'s `start` and `deleteCount` arguments.

          update = function update(record) {
            // We have to consider only the newly shown elements that are not in
            // the order list yet. We should do it AFTER the visibility update
            // happens because otherwise we won't be able to distinguish if the
            // element should be included in the order list.
            // Update record visibility
            record.isShown = record.parent ? record.parent.public.isOpen && record.parent.isShown : true;

            if (record.isShown) {
              var currentOrderPart = orderParts[orderParts.length - 1];
              currentOrderPart.push(record.public.data.id);

              if (currentOrderPart.length === MAX_FUNCTION_ARGUMENTS + SPLICE_DEFAULT_ARGUMENTS_NUMBER) {
                orderParts.push([index + 1 + MAX_FUNCTION_ARGUMENTS * orderParts.length, 0]);
              }
            }
          };

          apply = function apply() {
            for (var i = 0; i < orderParts.length; i++) {
              var _ref7;

              // @ts-expect-error: too generic for TS
              (_ref7 = order).splice.apply(_ref7, orderParts[i]);
            }
          };
        })();
      } else if (ownerRecord.public.isOpen) {
        (function () {
          // If received rules require us to close the subtree, we have to remove
          // all subtree ids from the order list.
          var index = order.indexOf(id);
          var count = 0;

          update = function update(record) {
            // We have to consider only currently visible subtree nodes BEFORE
            // their visibility is updated. Otherwise we will have incorrect
            // number of items to remove: we cannot remove elements that are not
            // in the order list.
            //
            // If we do it after the visibility update, we will be unable to
            // understand if the element is still in the order list.
            if (record.isShown) {
              count += 1;
            } // Update record visibility


            record.isShown = record.parent ? record.parent.public.isOpen && record.parent.isShown : true;
          };

          apply = function apply() {
            // Remove data after element with index
            order.splice(index + 1, count);
          };
        })();
      }
    }

    var currentRecord = ownerRecord;

    while (currentRecord !== null) {
      if (!currentRecord.visited) {
        currentRecord.public.isOpen = currentRecord === ownerRecord ? open : currentRecord.public.isOpen;
        subtreeCallback(currentRecord.public, ownerRecord.public);

        if (currentRecord !== ownerRecord) {
          update(currentRecord);
        }

        currentRecord.visited = currentRecord.child !== null; // This algorithm is a bit different from the visit algorithm in the
        // tree generator. We are restricted with the bounds of a subtree and
        // shouldn't go over it. So we cannot search for the ownerRecord's
        // parent or sibling because it will lead us out of the subtree.

        currentRecord = // Look for child in any case
        currentRecord.child !== null ? currentRecord.child : // Stop looking for next element if currentRecord is root.
        currentRecord === ownerRecord ? null : // Otherwise, look for sibling or parent
        currentRecord.sibling !== null ? currentRecord.sibling : currentRecord.parent;
      } else {
        currentRecord.visited = false;
        currentRecord = currentRecord === ownerRecord ? null : currentRecord.sibling !== null ? currentRecord.sibling : currentRecord.parent;
      }
    }

    apply();
  }

  return {
    order: order,
    records: records,
    updateRequest: {}
  };
};

var createTreeComputer = function createTreeComputer(creatorOptions) {
  return function (props, state, options) {
    return options.refresh ? generateNewTree(creatorOptions, props, state) : updateExistingTree(state, options);
  };
};

exports.createTreeComputer = createTreeComputer;

var Tree = /*#__PURE__*/function (_PureComponent) {
  (0, _inheritsLoose2.default)(Tree, _PureComponent);

  Tree.getDerivedStateFromProps = function getDerivedStateFromProps(props, state) {
    var _props$listRef = props.listRef,
        listRef = _props$listRef === void 0 ? null : _props$listRef,
        treeWalker = props.treeWalker;
    var computeTree = state.computeTree,
        list = state.list,
        order = state.order,
        oldTreeWalker = state.treeWalker;
    return (0, _extends2.default)({
      attachRefs: (0, _reactMergeRefs.default)([list, listRef])
    }, treeWalker !== oldTreeWalker || !order ? computeTree(props, state, {
      refresh: true
    }) : null, {
      treeWalker: treeWalker
    });
  };

  function Tree(props, context) {
    var _this;

    _this = _PureComponent.call(this, props, context) || this;
    _this.getRecordData = _this.getRecordData.bind((0, _assertThisInitialized2.default)(_this));
    /* eslint-disable react/no-unused-state,@typescript-eslint/consistent-type-assertions */

    _this.state = {
      list: /*#__PURE__*/(0, _react.createRef)(),
      recomputeTree: _this.recomputeTree.bind((0, _assertThisInitialized2.default)(_this)),
      setState: _this.setState.bind((0, _assertThisInitialized2.default)(_this))
    };
    /* eslint-enable react/no-unused-state,@typescript-eslint/consistent-type-assertions */

    return _this;
  }

  var _proto = Tree.prototype;

  _proto.getItemData = function getItemData() {
    var _this$props = this.props,
        component = _this$props.children,
        treeData = _this$props.itemData;
    return {
      component: component,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      getRecordData: this.getRecordData,
      treeData: treeData
    };
  };

  _proto.getRecordData = function getRecordData(index) {
    var _this$state = this.state,
        order = _this$state.order,
        records = _this$state.records;
    return records.get(order[index]).public;
  };

  _proto.recomputeTree = function recomputeTree(state) {
    var _this2 = this;

    return new Promise(function (resolve) {
      _this2.setState(function (prevState) {
        return prevState.computeTree(_this2.props, prevState, {
          opennessState: state
        });
      }, resolve);
    });
  };

  _proto.scrollTo = function scrollTo(scrollOffset) {
    var _this$state$list$curr;

    // eslint-disable-next-line react/destructuring-assignment
    (_this$state$list$curr = this.state.list.current) == null ? void 0 : _this$state$list$curr.scrollTo(scrollOffset);
  };

  _proto.scrollToItem = function scrollToItem(id, align) {
    var _this$state$list$curr2;

    // eslint-disable-next-line react/destructuring-assignment
    (_this$state$list$curr2 = this.state.list.current) == null ? void 0 : _this$state$list$curr2.scrollToItem(this.state.order.indexOf(id), align);
  };

  return Tree;
}(_react.PureComponent);

Tree.defaultProps = {
  rowComponent: Row
};
var _default = Tree;
exports.default = _default;
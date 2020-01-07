///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//	Defect ID	: TECH-35124
//	Date		: 20-Jun-2019
//	Description	: ES6 code implementation written for rule builder should be changed since it is not supported by Internet Explorer
//	Fixed by	: Giridharan V
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//	Defect ID	: TECH-35295
//	Date		: 27-Jun-2019
//	Description	: Multi-select implementation
//	Fixed by	: Giridharan V
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// TECH-34667, // TECH-35295
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//	Defect ID	: TECH-36471 / TECH-36473
//	Date		: 30-Jul-2019
//	Description	: Co-Ordinate control, Rule Builder not refreshing once rendered, Associated list edit control is visible
// 								Filter readonly not working if passed as metadata, Column captions for multiselect not changing dynamically
//	Fixed by	: Giridharan V
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Ext.define('Ext.ramco.RSListViewRB', {
    extend: 'Ext.ramco.RSListView',
	xtype: 'ramcorslistviewrb',
	initComponent: function() {
        var me = this;
        me.callParent(arguments);
    },
	setStore: function(store) {
        var me = this,
            oldStore = me.store;
			
        if (store && store !== oldStore) {
            me.unbindStore();
            me.bindStore(store);
        }
        if (this.autoLoad && !store.isEmptyStore && !(store.loading || store.isLoaded())) {
            store.load();
        }
    },
	setValue: function(value) {
        var me = this;

		me.callParent(arguments);

		if(me.setValueRB)
			me.setValueRB(value);
	},
	afterRender: function() {
        var me = this;
        me.callParent(arguments);
	},
	selectItem: function(record) {
        var me = this;
        me.callParent(arguments);
    },
	setSelectedRows: function(store) {
		var me = this;
		me.callParent(arguments);
	},
	onExpand: function() {
        var me = this;
		me.callParent(arguments);

		if(me.onExpandRB)
			me.onExpandRB();
    }
});

Ext.define('Ext.ramco.RuleBuilder', {
	// extend: 'Ext.ux.IFrame', // TECH-35295
	extend: 'Ext.panel.Panel',
    xtype: 'ramcorbview',
	// TECH-35295
	// src: '../rulebuilder/rulebuilder.htm',
    defaultBindProperty: 'store',
    padding: 0,
    layout: {
        type: 'vbox',
        align: 'stretch'
    },
    items: [],
	initComponent: function() {
		var me = this, assCtrlRule, assCtrlSql;
		if(Ext.isEmpty(me.height))
			me.height = 400;
        if (me.items) {
            me.items.push({
                itemId: "nullItem",
                name: "nullItem",
                xtype: "ramcolabel",
                value: "",
                hidden: true
            });
        }
		me.callParent();
	},
	currentValue: {},
	assCtrlRuleObject: null,
	assCtrlSqlObject: null,
	// TECH-35295
	assCtrlListObject: null,
	assCtrlListEdit: null,
	destroy: function(){
		var me = this;
		// TECH-36473
		if(me.queryBuilderContainer && typeof $("#" + me.queryBuilderContainer).queryBuilder != "undefined")
			$("#" + me.queryBuilderContainer).queryBuilder("destroy");
	},
	setValue: function(value){
		var filterList, currentFilter, filterType, filterOperators, allowMultiple = false, inputType, me = this;
		var minValue, maxValue, stepValue, rowsValue, vertical, allow_empty_value, listValues, defaultValue, sizeValue, defaultOperator;
		var currentPage, idValue, idValueSys;
		var sort_filters, allow_groups, display_empty_filter, select_placeholder, filter_readonly, operator_readonly;
		var value_readonly, condition_readonly, no_add_rule, no_add_group, dateFormatTmp;
		// TECH-35295
		var precisionValue, sliderLabels = [];
		var dataRefresh, keyColumn, columnCaption;
		var coOrdValues1, coOrdValues2, coOrdValues3, valueFieldWidth;

		currentPage = me.up("ilbo");

		// TECH-35295
		if(me.assCtrlRuleObject == null)
		{
			me.assCtrlRuleObject = currentPage.getControl(me.assCtrlRule);
			me.assCtrlSqlObject = currentPage.getControl(me.assCtrlSql);
			me.assCtrlListObject = currentPage.getControl(me.assCtrlList);
			me.assCtrlListEdit = me.assCtrlListEdit;

			me.assCtrlRuleObject.hide();
			me.assCtrlSqlObject.hide();

			// TECH-36471
			if(me.assCtrlListObject)
				me.assCtrlListObject.hide();

			if(currentPage.getControl(me.assCtrlListEdit))
				currentPage.getControl(me.assCtrlListEdit).hide();
		}
		
		me.filters = [];
		me.currentValue = {};
		
		// TECH-35124
		filterList = value.store.filter( function(obj){return obj.v1002 == "label"}).map( function(obj){return [obj.v1001, obj.v1003]} );

		for(var filterCnt = 0; filterCnt < filterList.length; filterCnt++)
		{
			idValue = value.store.filter( function(obj){return obj.v1001 == filterList[filterCnt][0]}).filter( function(obj){return obj.v1002 === "id"} ).map( function(obj){return obj.v1003} );

			idValueSys = filterList[filterCnt][0];
			if(idValue.length > 0)
				filterList[filterCnt][0] = idValue[0];

			currentFilter = me.createFilter(filterList[filterCnt]);

			filterType = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "type"} ).map( function(obj){return obj.v1003} );
			
			if(filterType.length > 0)
				filterType = filterType[0].toLowerCase();

			currentFilter.type = filterType;

			filterOperators = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "operator"} ).map( function(obj){return obj.v1003} );

			if(filterOperators.length < 1)
				filterOperators = me.getDefaultOperators(filterType);

			currentFilter.operators = filterOperators;

			inputType = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "input"} ).map( function(obj){return obj.v1003} );

			if(inputType.length > 0)
				inputType = inputType[0].toLowerCase();

			allowMultiple = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "multiple"} ).map( function(obj){return obj.v1003} );

			if(allowMultiple.length > 0)
				allowMultiple = allowMultiple[0];

			if((allowMultiple == "true") && (inputType == "select" || inputType == "combo"))
				inputType = "multiselect";

			// TECH-35295
			precisionValue = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "precision"} ).map( function(obj){return obj.v1003} );

			if(precisionValue.length > 0)
				precisionValue = precisionValue[0];

			switch(filterType)
			{
				case "date":
					inputType = "dtpicker";
					break;
				case "datetime":
					inputType = "dttpicker";
					break;
				case "time":
					inputType = "tpicker";
					break;
			}

			// TECH-35295
			currentFilter = me.getDefaultAttributes(inputType, filterType, currentFilter, precisionValue);
			sliderLabels = [];

			minValue = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "min"} ).map( function(obj){return obj.v1003} );

			if(minValue.length > 0)
			{
				minValue = minValue[0];

				switch(filterType)
				{
					case "date":
						minValue = Ext.util.Format.date(minValue, RamcoRTC.userPreference.dateFormat);
						break;
					case "datetime":
						minValue = Ext.util.Format.date(minValue, RamcoRTC.userPreference.dateTimeFormat);
						break;
					case "time":
						minValue = Ext.util.Format.date(minValue, RamcoRTC.userPreference.timeFormat);
						break;
				}

				// TECH-35295
				if(inputType == "slider")
				{
					currentFilter.plugin_config.min = parseFloat(minValue);
					sliderLabels.push(parseFloat(minValue));
				}

				currentFilter.validation.min = minValue;
			}

			maxValue = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "max"} ).map( function(obj){return obj.v1003} );

			if(maxValue.length > 0)
			{
				maxValue = maxValue[0];

				switch(filterType)
				{
					case "date":
						maxValue = Ext.util.Format.date(maxValue, RamcoRTC.userPreference.dateFormat);
						break;
					case "datetime":
						maxValue = Ext.util.Format.date(maxValue, RamcoRTC.userPreference.dateTimeFormat);
						break;
					case "time":
						maxValue = Ext.util.Format.date(maxValue, RamcoRTC.userPreference.timeFormat);
						break;
				}

				// TECH-35295
				if(inputType == "slider")
				{
					currentFilter.plugin_config.max = parseFloat(maxValue);
					sliderLabels.push(parseFloat(maxValue));
				}

				currentFilter.validation.max = maxValue;
			}
			
			stepValue = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "step"} ).map( function(obj){return obj.v1003} );

			if(stepValue.length > 0)
			{
				stepValue = stepValue[0];
				if(inputType == "slider")
					currentFilter.plugin_config.step = parseFloat(stepValue);;
				currentFilter.validation.step = stepValue;
			}

			rowsValue = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "rows"} ).map( function(obj){return obj.v1003} );

			if(rowsValue.length > 0)
			{
				rowsValue = rowsValue[0];
				currentFilter.rows = rowsValue;
			}

			vertical = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "vertical"} ).map( function(obj){return obj.v1003} );

			if(vertical.length > 0)
			{
				vertical = vertical[0];
				currentFilter.vertical = (vertical == "true");
			}

			allow_empty_value = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "allow_empty_value"} ).map( function(obj){return obj.v1003} );

			if(allow_empty_value.length > 0)
			{
				allow_empty_value = allow_empty_value[0];
				currentFilter.allow_empty_value = (allow_empty_value == "true");
			}

			defaultValue = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "default_value"} ).map( function(obj){return obj.v1003} );

			if(defaultValue.length > 0)
			{
				defaultValue = defaultValue[0];
				currentFilter.default_value = defaultValue;
			}

			sizeValue = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "size"} ).map( function(obj){return obj.v1003} );

			if(sizeValue.length > 0)
			{
				sizeValue = sizeValue[0];
				currentFilter.size = sizeValue;
			}

			defaultOperator = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "default_operator"} ).map( function(obj){return obj.v1003} );

			if(defaultOperator.length > 0)
			{
				defaultOperator = defaultOperator[0];
				currentFilter.default_operator = defaultOperator;
			}

			// TECH-35295
			columnCaption = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "columncaption"} ).map( function(obj){return obj.v1003} );

			if(columnCaption.length > 0)
			{
				columnCaption = columnCaption[0];
				currentFilter.columncaption = columnCaption;
			}
			
			keyColumn = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "keycolumn"} ).map( function(obj){return obj.v1003} );

			if(keyColumn.length > 0)
			{
				keyColumn = keyColumn[0];
				currentFilter.keycolumn = keyColumn;
			}
			
			dataRefresh = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "datarefresh"} ).map( function(obj){return obj.v1003} );

			if(dataRefresh.length > 0)
			{
				dataRefresh = dataRefresh[0];
				currentFilter.datarefresh = dataRefresh;
			}

			actionsBox = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "actionsBox"} ).map( function(obj){return obj.v1003} );

			if(actionsBox.length > 0)
			{
				actionsBox = actionsBox[0];
				currentFilter.plugin_config.actionsBox = (actionsBox == "true");
			}
			
			liveSearch = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "liveSearch"} ).map( function(obj){return obj.v1003} );

			if(liveSearch.length > 0)
			{
				liveSearch = liveSearch[0];
				currentFilter.plugin_config.liveSearch = (liveSearch == "true");
			}
			
			width = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "width"} ).map( function(obj){return obj.v1003} );

			if(width.length > 0)
			{
				width = width[0];
				currentFilter.plugin_config.width = width;
			}

			selectedTextFormat = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "selectedTextFormat"} ).map( function(obj){return obj.v1003} );

			if(selectedTextFormat.length > 0)
			{
				selectedTextFormat = selectedTextFormat[0];
				currentFilter.plugin_config.selectedTextFormat = selectedTextFormat;
			}
			
			liveSearchStyle = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "liveSearchStyle"} ).map( function(obj){return obj.v1003} );

			if(liveSearchStyle.length > 0)
			{
				liveSearchStyle = liveSearchStyle[0];
				currentFilter.plugin_config.liveSearchStyle = liveSearchStyle;
			}

			listValues = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "values"} ).map( function(obj){return obj.v1003} );

			if(listValues.length > 0)
			{
				for(var listCnt = 0; listCnt < listValues.length; listCnt++)
				{
					currentFilter.values[listValues[listCnt]] = listValues[listCnt];
				}
			}

			// TECH-35295, TECH-36471
			coOrdValues1 = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "values1"} ).map( function(obj){ var idVal, dispVal, cmbValue; cmbValue = obj.v1003.split(":"); if(cmbValue.length > 1){idVal = cmbValue[0]; dispVal = cmbValue.splice(1).join(":");} else{idVal = dispVal = cmbValue[0];}   return '<option value="' + idVal + '">' + dispVal + '</option>';});

			if(coOrdValues1.length > 0)
			{
				if(!currentFilter.values)
					currentFilter.values = [];
				currentFilter.values[0] = coOrdValues1;
			}

			// TECH-36471
			coOrdValues2 = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "values2"} ).map( function(obj){ var idVal, dispVal, cmbValue; cmbValue = obj.v1003.split(":"); if(cmbValue.length > 1){idVal = cmbValue[0]; dispVal = cmbValue.splice(1).join(":");} else{idVal = dispVal = cmbValue[0];}   return '<option value="' + idVal + '">' + dispVal + '</option>';} );

			if(coOrdValues2.length > 0)
			{
				if(!currentFilter.values)
					currentFilter.values = [];

				currentFilter.values[1] = coOrdValues2;
			}

			// TECH-36471
			coOrdValues3 = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "values3"} ).map( function(obj){ var idVal, dispVal, cmbValue; cmbValue = obj.v1003.split(":"); if(cmbValue.length > 1){idVal = cmbValue[0]; dispVal = cmbValue.splice(1).join(":");} else{idVal = dispVal = cmbValue[0];}   return '<option value="' + idVal + '">' + dispVal + '</option>';} );

			if(coOrdValues3.length > 0)
			{
				if(!currentFilter.values)
					currentFilter.values = [];
				currentFilter.values[2] = coOrdValues3;
			}

			// TECH-36471
			filter_readonly = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "filter_readonly"} ).map( function(obj){return obj.v1003} );

			if(filter_readonly.length > 0)
			{
				filter_readonly = filter_readonly[0];
				if(!currentFilter.flags)
					currentFilter.flags = {};

				currentFilter.flags.filter_readonly = (filter_readonly == "true");
			}

			operator_readonly = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "operator_readonly"} ).map( function(obj){return obj.v1003} );

			if(operator_readonly.length > 0)
			{
				operator_readonly = operator_readonly[0];

				if(!currentFilter.flags)
					currentFilter.flags = {};

				currentFilter.flags.operator_readonly = (operator_readonly == "true");
			}

			value_readonly = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "value_readonly"} ).map( function(obj){return obj.v1003} );

			if(value_readonly.length > 0)
			{
				value_readonly = value_readonly[0];
				if(!currentFilter.flags)
					currentFilter.flags = {};

				currentFilter.flags.value_readonly = (value_readonly == "true");
			}

			valueFieldWidth = value.store.filter( function(obj){return obj.v1001 == idValueSys}).filter( function(obj){return obj.v1002 === "valuefieldwidth"} ).map( function(obj){ return obj.v1003;} );

			if(valueFieldWidth.length > 0)
			{
				// TECH-36471
				valueFieldWidth = valueFieldWidth[0];

				if(valueFieldWidth.indexOf("~#~"))
					currentFilter.valuefieldwidth = valueFieldWidth.split("~#~");
				else
					currentFilter.valuefieldwidth = valueFieldWidth;
			}

			if(idValueSys == currentFilter.id)
				currentFilter.id = "cbk_" + currentFilter.id;

			if(filterCnt == 0)
				me.currentValue.default_filter = currentFilter.id;
			
			me.filters.push(currentFilter);
		}

		if(me.filters.length > 0)
		{
			// TECH-35295
			me.currentValue.assCtrlRuleObject = me.assCtrlRuleObject;
			me.currentValue.assCtrlSqlObject = me.assCtrlSqlObject;
			me.currentValue.assCtrlListObject = me.assCtrlListObject;
			me.currentValue.assCtrlListEdit = me.assCtrlListEdit;
			me.currentValue.plugins = me.getDefaultPlugins();
			me.currentValue.filters = me.filters;
			// TECH-36471
			if(!me.currentValue.flags)
				me.currentValue.flags = {};
			
			me.currentValue.allow_empty = true;

			sort_filters = value.store.filter( function(obj){return obj.v1001 == '0'}).filter( function(obj){return obj.v1002 === "sort_filters"} ).map( function(obj){return obj.v1003} );

			if(sort_filters.length > 0)
			{
				sort_filters = sort_filters[0];
				// TECH-36471
				me.currentValue.flags.sort_filters = (sort_filters == "true");

				// TECH-36473
				if(typeof me.currentValue.default_group_flags == "undefined")
					me.currentValue.default_group_flags = {};

				me.currentValue.default_group_flags.no_sortable = (sort_filters == "true");
			}
			
			allow_groups = value.store.filter( function(obj){return obj.v1001 == '0'}).filter( function(obj){return obj.v1002 === "allow_groups"} ).map( function(obj){return obj.v1003} );

			if(allow_groups.length > 0)
			{
				// TECH-36473
				allow_groups = allow_groups[0];

				me.currentValue.flags.allow_groups = (allow_groups == "true");
			}

			display_empty_filter = value.store.filter( function(obj){return obj.v1001 == '0'}).filter( function(obj){return obj.v1002 === "display_empty_filter"} ).map( function(obj){return obj.v1003} );

			if(display_empty_filter.length > 0)
			{
				// TECH-36473
				display_empty_filter = display_empty_filter[0];

				me.currentValue.flags.display_empty_filter = (display_empty_filter == "true");
			}
			
			select_placeholder = value.store.filter( function(obj){return obj.v1001 == '0'}).filter( function(obj){return obj.v1002 === "select_placeholder"} ).map( function(obj){return obj.v1003} );

			if(select_placeholder.length > 0)
			{
				// TECH-36473
				select_placeholder = select_placeholder[0];

				me.currentValue.flags.select_placeholder = select_placeholder;
			}

			condition_readonly = value.store.filter( function(obj){return obj.v1001 == '0'}).filter( function(obj){return obj.v1002 === "condition_readonly"} ).map( function(obj){return obj.v1003} );

			if(condition_readonly.length > 0)
			{
				// TECH-36473
				condition_readonly = condition_readonly[0];

				me.currentValue.flags.condition_readonly = (condition_readonly == "true");
				// TECH-36473
				if(typeof me.currentValue.default_group_flags == "undefined")
					me.currentValue.default_group_flags = {};

				me.currentValue.default_group_flags.condition_readonly = (condition_readonly == "true");
			}

			no_add_rule = value.store.filter( function(obj){return obj.v1001 == '0'}).filter( function(obj){return obj.v1002 === "no_add_rule"} ).map( function(obj){return obj.v1003} );

			if(no_add_rule.length > 0)
			{
				// TECH-36473
				no_add_rule = no_add_rule[0];

				me.currentValue.flags.no_add_rule = (no_add_rule == "true");
				// TECH-36473
				if(typeof me.currentValue.default_group_flags == "undefined")
					me.currentValue.default_group_flags = {};

				me.currentValue.default_group_flags.no_add_rule = (no_add_rule == "true");
			}

			no_add_group = value.store.filter( function(obj){return obj.v1001 == '0'}).filter( function(obj){return obj.v1002 === "no_add_group"} ).map( function(obj){return obj.v1003} );

			if(no_add_group.length > 0)
			{
				// TECH-36473
				no_add_group = no_add_group[0];

				me.currentValue.flags.no_add_group = (no_add_group == "true");
				// TECH-36473
				if(typeof me.currentValue.default_group_flags == "undefined")
					me.currentValue.default_group_flags = {};

				me.currentValue.default_group_flags.no_add_group = (no_add_group == "true");
			}

			try
			{
				if(currentPage.viewModel.data[me.assCtrlRule].value != "")
					me.currentValue.rules = JSON.parse(currentPage.viewModel.data[me.assCtrlRule].value);
				else // TECH-36473
					me.currentValue.rules = [];
			}
			catch(parseErr){
				console.log("Error in Rule Builder Parser." + parseErr);
			}

			// TECH-35295
			/*if(typeof me.getFrame().contentWindow.createBuilder == "undefined")
				me.getFrame().contentWindow.currentValue = me.currentValue;
			else
			{
				me.getFrame().contentWindow.currentValue = undefined;
				me.getFrame().contentWindow.createBuilder(me.currentValue);
			}*/
			me.getEl().dom.children[0].style.display = "none";
			me.queryBuilderContainer = me.getEl().dom.getAttribute("id");
			me.createBuilder(me.currentValue, me.queryBuilderContainer);
		} // TECH-36473
		else
		{
			me.getEl().dom.children[0].style.display = "none";
			me.queryBuilderContainer = me.getEl().dom.getAttribute("id");
			me.createBuilder("clear", me.queryBuilderContainer);
		}
	},
	// TECH-35295
	createBuilder: function(_dataValue, divRuleBuilder){
		try{
			// TECH-36473
			$("#"+divRuleBuilder).queryBuilder("destroy");

			if(_dataValue == "clear")
				return;

			$("#"+divRuleBuilder).on('afterAddGroup.queryBuilder', function(e, group) {
			  if(this.id + "_group_0" == group.id)
			  {
				this.groupWidth = (this.parentElement.clientWidth) + "px";
				group.$el.get()[0].style.maxHeight = (this.parentElement.clientHeight - 22) + "px";
				group.$el.get()[0].style.height = (this.parentElement.clientHeight - 22) + "px"; // TECH-36473
				group.$el.get()[0].style.maxWidth = (this.parentElement.clientWidth) + "px";
				group.$el.get()[0].style.width = (this.parentElement.clientWidth) + "px";
				group.$el.get()[0].style.overflow = "auto";
			  }
			  else
				group.$el.get()[0].style.width = this.groupWidth;
			})

			$("#"+divRuleBuilder).on('afterUpdateRuleValue.queryBuilder', function(e, rule) {
			  if (rule.filter.plugin === 'datepicker' && rule.value != "") {
				var dateValue = moment(rule.value, top.RamcoRTC.userPreference.dateFormat.toUpperCase());
				if(dateValue.isValid())
				{
					rule.$el.find('.rule-value-container input').datepicker('update');
					rule.$el.find('.rule-value-container .input-group.date').datepicker('update');
				}
			  }
			})

			// TECH-35295
			$("#" + divRuleBuilder).on('afterUpdateRuleOperator.queryBuilder', function(e, rule) {
				var ruleNativeInput, ruleNativeInputArr, inputType;

				inputType = rule.filter.input;
				
				switch(inputType){
					case "select":
						inputType = "select";
						break;
					default:
						inputType = "input";
						break;
				}

				ruleNativeInput = rule.$el.find('.rule-value-container ' + inputType);

				if(rule.filter.valuefieldwidth)
				{
					ruleNativeInputArr = ruleNativeInput.get();
					if(Array.isArray(ruleNativeInputArr)){
						for(var inpCnt=0; inpCnt < ruleNativeInputArr.length; inpCnt++){
							// TECH-36471
							if(Array.isArray(rule.filter.valuefieldwidth))
							{
								if(rule.filter.valuefieldwidth[inpCnt] != null)
									ruleNativeInputArr[inpCnt].style.width = rule.filter.valuefieldwidth[inpCnt] + "px";
							}
							else
								ruleNativeInputArr[inpCnt].style.width = rule.filter.valuefieldwidth + "px";
						}
					}
					else
						ruleNativeInputArr.style.width = rule.filter.valuefieldwidth + "px";
				}
			});
			

			$("#" + divRuleBuilder).on('afterUpdateRuleFilter.queryBuilder', function(e, rule) {
				var ruleNativeInput, msControlId, msControlObject, msInitialConfig;
				// TECH-35295
				var ruleNativeInputArr, inputType;

				inputType = rule.filter.input;
				
				switch(inputType){
					case "select":
						inputType = "select";
						break;
					default:
						inputType = "input";
						break;
				}

				ruleNativeInput = rule.$el.find('.rule-value-container ' + inputType);
				
				if(rule.filter.valuefieldwidth)
				{
					ruleNativeInputArr = ruleNativeInput.get();
					if(Array.isArray(ruleNativeInputArr)){
						for(var inpCnt=0; inpCnt < ruleNativeInputArr.length; inpCnt++){
							// TECH-36471
							if(Array.isArray(rule.filter.valuefieldwidth))
							{
								if(rule.filter.valuefieldwidth[inpCnt] != null)
									ruleNativeInputArr[inpCnt].style.width = rule.filter.valuefieldwidth[inpCnt] + "px";
							}
							else
								ruleNativeInputArr[inpCnt].style.width = rule.filter.valuefieldwidth + "px";
						}
					}
					else
						ruleNativeInputArr.style.width = rule.filter.valuefieldwidth + "px";
				}

				if(rule.filter.input == "text" && rule.filter.multiple == true && ruleNativeInput.get()[0])
				{
					var currStore, columnCaption, dataRefresh;

					// TECH-36473
					if(this.queryBuilder.settings.assCtrlListObject)
						this.queryBuilder.settings.assCtrlListObject.value = null;

					if(!ruleNativeInput.get()[1])
					{
						msControlId = ruleNativeInput.get()[0].getAttribute("name");
						currStore = this.queryBuilder.settings.assCtrlListObject.store.config;
						currStore.storeId = msControlId + "_ms_store";
						currStore = JSON.parse(JSON.stringify(currStore));
						currStore.data = [];
						currStore = Ext.create("Ext.data.Store", currStore);

						ruleNativeInput.get()[0].parentElement.setAttribute("id", msControlId + "par");
						msInitialConfig = this.queryBuilder.settings.assCtrlListObject.initialConfig;
						msInitialConfig.itemId = msControlId + "_ms";
						msInitialConfig.bind.store = "{" + currStore.storeId + "}";
						msInitialConfig.bind.value = "{" + msControlId + "_ms}";
					}
					else
					{
						msControlObject = ruleNativeInput.get()[1];
						msInitialConfig = msControlObject.config;
					}

					if(rule.selrows)
						rule.selrows = "";

					for(var colCntMn = 1; colCntMn < msInitialConfig.columns.length; colCntMn++){
							msInitialConfig.columns[colCntMn].hidden = true;
					}

					columnCaption = rule.filter.columncaption;
					
					if(columnCaption)
					{
						columnCaption = columnCaption.split("~#~");
						for(var colCapCnt = 0; colCapCnt < columnCaption.length; colCapCnt++){
							if(columnCaption[colCapCnt].length > 0)
								msInitialConfig.columns[colCapCnt + 1].hidden = false;

							msInitialConfig.columns[colCapCnt + 1].text = columnCaption[colCapCnt];
						}
					}

					// TECH-36473
					if(!msControlObject)
					{
						msControlObject = Ext.create(Ext.ramco.RSListViewRB, msInitialConfig);
						msControlObject.filterValue = rule.filter.label;
						msControlObject.keyColumn = rule.filter.keycolumn;
						msControlObject.dataRefresh = rule.filter.datarefresh;

						if(typeof msControlObject.dataRefresh == "undefined")
							msControlObject.dataRefresh = "N";
						
						msControlObject.dataRefresh = msControlObject.dataRefresh.toUpperCase();
						
						if(typeof msControlObject.keyColumn == "undefined")
							msControlObject.keyColumn = 1;
						
						msControlObject.assCtrlListEdit = this.queryBuilder.settings.assCtrlListEdit;
						msControlObject.assCtrlList = this.queryBuilder.settings.assCtrlListObject.itemId;
						msControlObject.rule = rule;
						msControlObject.config = this.queryBuilder.settings.assCtrlListObject.cloneConfig();
					}

					// TECH-35295
					if(rule.flags.selrowscnt)
					{
						currStore.nsr = rule.flags.selrowscnt;
						rule.flags.selrowscnt = 0;
					}

					msControlObject.setStore(currStore);

					// TECH-35295
					if(currStore.nsr)
						msControlObject.setSelectedRows(currStore);

					msControlObject.onExpandRB = function(){
						var mainControllerRB, uiEditRB, viewRB, me, msCtrl;
						me = this;

						// TECH-36473
						for(var colCntMn = 1; colCntMn < me.config.columns.length; colCntMn++){
							me.picker.getColumnManager().getColumns()[colCntMn].hide();
						}
						
						columnCaption = rule.filter.columncaption;

						if(columnCaption)
						{
							columnCaption = columnCaption.split("~#~");
							for(var colCapCnt = 0; colCapCnt < columnCaption.length; colCapCnt++){
								if(columnCaption[colCapCnt].length > 0)
									me.picker.getColumnManager().getColumns()[colCapCnt + 1].show();

								me.picker.getColumnManager().getHeaderAtIndex(colCapCnt + 1).setText(columnCaption[colCapCnt]);
							}
						}
						
						if(me.rule.selrows && me.store.data.length < 1)
							me.selrows = me.rule.selrows;
						else
							me.selrows = "";

						if(me.sysexpand)
						{
							me.sysexpand = false;
							return true;
						}

						mainControllerRB = getMainController();
						viewRB = mainControllerRB.getCurrentView();
						if(me.store.data.length < 1 || me.dataRefresh == "Y")
						{
							editCtrl = viewRB.getControl(me.assCtrlListEdit);
							editCtrl.setValue(me.filterValue);
							viewRB.setControlData(editCtrl.itemId, editCtrl.itemId, 0, me.filterValue);
							msCtrl = viewRB.getControl(me.assCtrlList);
							msCtrl.loadCtrl = me;
							RamcoRTC.focusCtrl = [];
							RamcoRTC.focusCtrl.push(viewRB.ilboConfig.ilboName);
							RamcoRTC.focusCtrl.push("rbctrl");
							RamcoRTC.focusCtrl.push("rbctrl");
							RamcoRTC.focusCtrl.push(0);
							viewRB.executeTask(editCtrl.uiTask, editCtrl.uiTaskType, false);
						}
					}
					
					msControlObject.onCollapse = function(){
						var inputValue = "", filterList, filter, currentValue = "", selRows = "";

						if(this.store.data.items.length > 0)
						{
							filter = new Ext.util.Filter({
                                    anyMatch: true,
                                    property: "sel",
                                    value: true
                                });

							this.store.filter(filter);

							for(var storeRowCnt = 0; storeRowCnt < this.store.data.items.length; storeRowCnt++){
								
								switch(this.keyColumn)
								{
									case "2":
										currentValue = this.store.data.items[storeRowCnt].data.v2;
										break;
									case "3":
										currentValue = this.store.data.items[storeRowCnt].data.v3;
										break;
									case "4":
										currentValue = this.store.data.items[storeRowCnt].data.v4;
										break;
									case "5":
										currentValue = this.store.data.items[storeRowCnt].data.v5;
										break;
									default:
										currentValue = this.store.data.items[storeRowCnt].data.v1;
										break;
								}
								
								if(storeRowCnt == 0)
								{
									inputValue = currentValue;
									selRows = this.store.data.items[storeRowCnt].data.rn;
								}
								else
								{
									inputValue += "," + currentValue;
									selRows += ", " + this.store.data.items[storeRowCnt].data.rn;
								}
							}
							
							this.store.clearFilter();
							
							this.rule.selrows = selRows;
							this.inputRBCtrl.value = inputValue;
							this.rule.value = inputValue;
						}
					}

					this.queryBuilder.settings.assCtrlListObject.setValueRB = function(value){
						var me = this;
						var record, selRows;

						if(me.loadCtrl)
						{
							me.loadCtrl.setValue(value);
							me.loadCtrl.sysexpand = true;
							selRows = me.loadCtrl.selrows;
							if(selRows){
								selRows = selRows.split(", ");

								me.loadCtrl.store.nsr = selRows.length;
								for(var selRowCnt = 0; selRowCnt < selRows.length; selRowCnt++){
									record = me.loadCtrl.store.getAt(selRows[selRowCnt] - 1);
									record.data.sel = "true";
									me.loadCtrl.selectItem(record);
								}
							}

							me.loadCtrl.onTriggerClick();
							me.loadCtrl = undefined;
						}
					}

					var stValue;
					if(this.queryBuilder.settings.assCtrlListObject.value)
					{
						stValue = this.queryBuilder.settings.assCtrlListObject.value;
						stValue.store = msControlObject.store;
						msControlObject.value = stValue;
						if (stValue.store) {
							msControlObject.store.tr = stValue.tr;
							msControlObject.store.nsr = stValue.nsr;
							msControlObject.store.si = stValue.si;
							msControlObject.store.vsi = stValue.vsi;
							msControlObject.setSelectedRows(msControlObject.store);
							msControlObject.store.searchGrid = true;
						}
					}
					else
					{
						stValue = {tr:0, nsr: 0, si: 0, vsi: 0, searchGrid: true};
						msControlObject.value = stValue;
						msControlObject.store.tr = 0;
						msControlObject.store.nsr = (msControlObject.store.nsr)? msControlObject.store.nsr : 0;
						msControlObject.store.si = 0;
						msControlObject.store.vsi = 0;
						msControlObject.setSelectedRows(msControlObject.store);
						msControlObject.store.searchGrid = true;
					}

					msControlObject.render(msControlId + "par");
					
					msControlObject.inputRBCtrl = ruleNativeInput.get()[0];
					ruleNativeInput.get()[0].style.display = "none";
				}
			})

			$("#" + divRuleBuilder).queryBuilder(_dataValue)
			.on("rulesChanged.queryBuilder afterClear.queryBuilder afterDeleteGroup.queryBuilder afterDeleteRule.queryBuilder afterInit.queryBuilder afterReset.queryBuilder afterSetRules.queryBuilder afterUpdateRuleFilter.queryBuilder afterUpdateRuleOperator.queryBuilder afterUpdateRuleValue.queryBuilder", function(event) {
				var resultValue = {};

				if(this.queryBuilder.model.root == null)
					return false;

				if($("#" + this.id).queryBuilder('getSQL') != null)
					resultValue.sql = $("#" + this.id).queryBuilder('getSQL', false).sql

				if($("#" + this.id).queryBuilder('getSQL') != null)
					resultValue.rules = $("#" + this.id).queryBuilder('getRules');

				this.queryBuilder.settings.assCtrlRuleObject.setValue(JSON.stringify(resultValue.rules));
				this.queryBuilder.settings.assCtrlSqlObject.setValue(resultValue.sql); // TECH-36473
			})

			$("#" + divRuleBuilder).queryBuilder('validate');
		}
		catch(jqex){
			console.log("Error in Rule Builder." + jqex);
		}
	},
	createFilter: function(_filterData){
		var returnFilter;
		returnFilter = {};
		returnFilter.id = _filterData[0];
		returnFilter.label = _filterData[1];
		return returnFilter;
	},
    setStore: function(store) {
        var me = this;
        store.load();
    },
	getDefaultPlugins: function(){
		return ['sortable', 'bt-tooltip-errors', 'bt-selectpicker', 'bt-checkbox', 'not-group'];
	},
	filters:[],
	// TECH-35295
	getDefaultAttributes: function(cType, dType, _filter, _precision) {
		var dateFormatTmp;

		_filter.validation = {};
		_filter.validation.allow_empty_value = true;
		switch(cType)
		{
			case "dttpicker":
				dateFormatTmp = RamcoRTC.userPreference.dateFormat.toUpperCase().replace("D", "DD").replace("M", "MM");
				dateFormatTmp = dateFormatTmp + " " + RamcoRTC.userPreference.timeFormat.replace('i', 'm').replace('g', 'h');
				_filter.validation.format = dateFormatTmp;
				_filter.plugin = 'datetimepicker';
				_filter.plugin_config = {};
				_filter.plugin_config.format = dateFormatTmp;
				_filter.input_event = 'dp.change';
				break;
			case "tpicker":
				dateFormatTmp = RamcoRTC.userPreference.timeFormat.replace('i', 'm').replace('g', 'h');
				_filter.validation.format = dateFormatTmp;
				_filter.plugin = 'datetimepicker';
				_filter.plugin_config = {};
				_filter.plugin_config.format = 'HH:mm:ss';
				_filter.plugin_config.format = dateFormatTmp;
				_filter.input_event = 'dp.change';
				break;
			case "dtpicker":
				_filter.validation.format = RamcoRTC.userPreference.dateFormat.toUpperCase().replace("D", "DD").replace("M", "MM").replace("Y", "YYYY");;
				_filter.plugin = 'datepicker';
				_filter.plugin_config = {};
				_filter.plugin_config.format = RamcoRTC.userPreference.dateFormat.toUpperCase().replace("D", "dd").replace("M", "mm").replace("Y", "yyyy");
				_filter.plugin_config.todayHighlight = true;
				_filter.plugin_config.allowInputToggle = true;
				_filter.plugin_config.autoclose = true;
				_filter.input_event = 'dp.change';

				break;
			case "textarea":
				_filter.rows = 3;
				_filter.input = 'textarea';
				break;
			case "select":
			case "combo":
				_filter.values = {};
				_filter.input = 'select';
				break;
			case "multiselect":
				// TECH-35295
				/*_filter.multiple = true;
				_filter.input = 'select';
				_filter.plugin = 'selectpicker';
				_filter.plugin_config = {};
				_filter.plugin_config.actionsBox = true;
				_filter.plugin_config.liveSearch = true;
				_filter.plugin_config.width = 'auto';
				_filter.plugin_config.selectedTextFormat = 'count';
				_filter.plugin_config.liveSearchStyle = 'contains';
				_filter.plugin_config.size = 5;
				_filter.values = {};*/
				_filter.multiple = true;
				_filter.input = 'text';
				_filter.valueGetter = function(rule) {
					var value = [];
					var ruleParent;
					ruleParent = rule.$el;
					rule.$el.find('.rule-value-container input').each(function() {
						value.push(this.value);
					});
					return rule.operator.nb_inputs == 1 ? value[0] : value;
				}
				
				_filter.validation.callback = function(value, rule){
					var resultValue, operator;
					resultValue = true;

					if(!rule || !value)
						return true;

					operator = rule.operator;
					value = value.split(",");

					if (!operator.multiple && value.length > 1) {
						result = ['operator_not_multiple', operator.type, this.translate('operators', operator.type)];
						resultValue = result;
					}
					
					return resultValue;
				}
				break;
			case "radio":
				_filter.values = {};
				_filter.input = 'radio';
				break;
			case "checkbox":
				_filter.color = 'primary';
				_filter.input = 'checkbox';
				_filter.values = {};
				break;
			case "slider":
				_filter.validation.step = 1;
				_filter.plugin = 'slider';
				_filter.plugin_config = {};
				_filter.plugin_config.value = 0;
				// TECH-35295
				if(_precision.length < 1)
					_precision = undefined;
				_filter.plugin_config.precision = _precision;
				_filter.plugin_config.formatter = function(val){
					if (Array.isArray(val)) {
						var val0 = GetFormattedNumber(val[0], undefined, this.precision);
						var val1 = GetFormattedNumber(val[1], undefined, this.precision);
						return val0 + " : " + val1;
					} else {
						var val1 = GetFormattedNumber(val, undefined, this.precision);
						return val1;
					}
				}
				_filter.valueSetter = function(rule, value) {
				  var input = rule.$el.find('.rule-value-container input');
				  input.slider('setValue', value);
				  input.val(value);
				}

				_filter.valueGetter = function(rule) {
					var value = [];
					var ruleParent;
					ruleParent = rule.$el;
					rule.$el.find('.rule-value-container input').each(function() {
						// TECH-35295
						value.push(parseFloat(GetRawNumber(this.value)));
					});
					return rule.operator.nb_inputs == 1 ? value[0] : value;
				}
				break;
			case "spin":
				if(dType == "integer" || dType == "double")
					_filter.validation.step = 1;
			default:
				// TECH-35295 // For Co-Ord Type Rule Inputs
				if(cType.indexOf("~#~") > -1){
					_filter.inputCord = cType;
					_filter.typeCord = dType;
					_filter.type = "string";
					_filter.input = function(rule, name) {
						  var $container = rule.$el.find('.rule-value-container');

						  var cTypeArr, returnText = "", inputType;
  						  var inputContent, coOrdValues;

						  cTypeArr = rule.filter.inputCord.split("~#~");

						  for(var cTypeArrCnt = 0; cTypeArrCnt < cTypeArr.length; cTypeArrCnt++){
							inputType = cTypeArr[cTypeArrCnt];

							switch(inputType){
								case "select":
									// TECH-36471
									inputContent = '<select class="form-control" name="' + name + '_' + (cTypeArrCnt + 1) + '">';
									coOrdValues = rule.filter.values[cTypeArrCnt];
									inputContent += coOrdValues.join("");
									inputContent += '</select>';
									break;
								default:
									inputContent = '<input class="form-control" name="' + name + '_' + (cTypeArrCnt + 1) + '" type="text"></input>';
									break;
							}
							returnText += inputContent;
						  }

						  return returnText;
						}
						
						_filter.valueGetter = function(rule) {
							// TECH-36471
						  return rule.$el.find('.rule-value-container [name$=_1]').val()
							+'$.$'+ rule.$el.find('.rule-value-container [name$=_2]').val();
						}

						_filter.valueSetter = function(rule, value) {
							// TECH-36471
						  if (rule.operator.nb_inputs > 0) {
							var val = value.split('$.$');

							rule.$el.find('.rule-value-container [name$=_1]').val(val[0]).trigger('change');
							rule.$el.find('.rule-value-container [name$=_2]').val(val[1]).trigger('change');
						  }
						}
				}
				else
					_filter.input = "text";
				break;
		}
		return _filter;
	},
	getDefaultOperators: function(type) {
		switch(type)
		{
			case "datetime":
			case "time":
			case "date":
				return ['equal', 'not_equal', 'less', 'less_or_equal', 'greater', 'greater_or_equal', 'between', 'not_between', 'is_null', 'is_not_null'];
				break;
			case "boolean":
				return ['equal', 'not_equal', 'is_null', 'is_not_null'];
				break;
			case "integer":
			case "double":
				return ['equal', 'not_equal', 'in', 'not_in', 'less', 'less_or_equal', 'greater', 'greater_or_equal', 'between', 'not_between', 'is_null', 'is_not_null'];
				break;
			 default:
				return ['equal', 'not_equal', 'in', 'not_in', 'less', 'less_or_equal', 'greater', 'greater_or_equal', 'between', 'not_between', 'begins_with', 'not_begins_with', 'contains', 'not_contains', 'ends_with', 'not_ends_with', 'is_empty', 'is_not_empty', 'is_null', 'is_not_null'];
				break;
		}
	}
});

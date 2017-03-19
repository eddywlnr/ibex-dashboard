import * as React from 'react';

import { DataSourceConnector, IDataSourceDictionary } from '../../../data-sources'
import ElementConnector from  '../../ElementConnector';

import DialogsActions from './DialogsActions';
import DialogsStore from './DialogsStore';

import MDDialog from 'react-md/lib/Dialogs';
import Button from 'react-md/lib/Buttons/Button';
import List from 'react-md/lib/Lists/List';
import ListItem from 'react-md/lib/Lists/ListItem';

import * as ReactGridLayout from 'react-grid-layout';
var ResponsiveReactGridLayout = ReactGridLayout.Responsive;
var WidthProvider = ReactGridLayout.WidthProvider;
ResponsiveReactGridLayout = WidthProvider(ResponsiveReactGridLayout);

interface IDialogProps {
  dialogData: IDialog
  dashboard: IDashboardConfig
}

interface IDialogState {
  dialogId?: string
  dialogArgs?: IDictionary
  mounted?: boolean
  currentBreakpoint?: string
  layouts?: ILayouts
}

export default class Dialog extends React.PureComponent<IDialogProps, IDialogState> {

  layouts = {};
  dataSources: IDataSourceDictionary = {};

  constructor(props) {
    super(props);

    this.state = DialogsStore.getState();
    this.onChange = this.onChange.bind(this);
    this.openDialog = this.openDialog.bind(this);

    // Create dialog data source
    var dialogDS: IDataSource = {
      id: 'dialog_' + this.props.dialogData.id,
      type: 'Constant',
      params: {
        selectedValue: null
      }
    };
    DataSourceConnector.createDataSources({ dataSources: [ dialogDS ] }, this.dataSources);

    // Adding other data sources
    DataSourceConnector.createDataSources(this.props.dialogData, this.dataSources);

    var layouts = ElementConnector.loadLayoutFromDashboard(this.props.dialogData, this.props.dashboard);
    
    this.layouts = layouts;
    this.state.mounted = false;
    this.state.currentBreakpoint = 'lg';
    this.state.layouts = { lg: layouts['lg'] };
  }

  componentDidMount() {
    this.setState({ mounted: true });
    DialogsStore.listen(this.onChange);

    DataSourceConnector.connectDataSources(this.dataSources);
  }

  componentDidUpdate() {
    const { dialogData } = this.props;
    var { dialogId, dialogArgs } = this.state;
    var datasourceId = 'dialog_' + dialogData.id;
    this.dataSources[datasourceId].action.updateDependencies(dialogArgs);
  }

  onBreakpointChange = (breakpoint) => {
    var layouts = this.state.layouts;
    layouts[breakpoint] = layouts[breakpoint] || this.layouts[breakpoint];
    this.setState({
      currentBreakpoint: breakpoint,
      layouts: layouts
    });
  };

  onChange(state) {
    var { dialogId, dialogArgs } = state;
    this.setState({ dialogId, dialogArgs });
  }

  closeDialog = () => {
    DialogsActions.closeDialog();
  };

  openDialog = () => {
    DialogsActions.openDialog('conversations', { title: this.state.dialogArgs['title'] + ':Blue', intent: 'bla', queryTimespan: 'jjj' });
  }

  render() {
    const { dialogData, dashboard } = this.props;
    const { id } = dialogData;
    const { dialogId, dialogArgs } = this.state;
    var { title } = dialogArgs || { title: '' }
    var visible = id === dialogId;

    if (!visible) {
      return null;
    }

    var { currentBreakpoint } = this.state;
    var layout = this.state.layouts[currentBreakpoint];

    // Creating visual elements
    var elements = ElementConnector.loadElementsFromDashboard(dialogData, layout)

    let grid = {
      className: "layout",
      rowHeight: dashboard.config.layout.rowHeight || 30,
      cols: dashboard.config.layout.cols,
      breakpoints: dashboard.config.layout.breakpoints
    };

    return (
      <MDDialog
        id={id}
        visible={visible}
        title={title}
        focusOnMount={false}
        onHide={this.closeDialog}
        dialogStyle={{ width: dialogData.width || '80%' }}
        contentStyle={{ padding: '0', maxHeight: 'calc(100vh - 148px)' }}
      >
        {/*<ResponsiveReactGridLayout
          { ...grid }
          layouts={ this.state.layouts }
          onBreakpointChange={this.onBreakpointChange}
          // WidthProvider option
          measureBeforeMount={false}
          // I like to have it animate on mount. If you don't, delete `useCSSTransforms` (it's default `true`)
          // and set `measureBeforeMount={true}`.
          useCSSTransforms={this.state.mounted}>*/}
          { elements }
        {/*</ResponsiveReactGridLayout>*/}
      </MDDialog>
    );
  }
}
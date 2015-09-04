var DataTable = require("datatables");

var table = $('#txlist').DataTable({
   "columns"    : [
    {
       "className":      'details-control',
       "orderable":      false,
       "data":           null,
       "defaultContent": '',
       "width" :         "20px",
    },
    {"data":"blocknr","width":"10em"},
    {"data":"from"                  },
    {"data":"to"                    },
    {"data":"op"     ,"width":"10em"},
   ],
   "paging"     : false,
   "bInfo"      : false,
   "order"      : [[ 1, "desc" ]],
   "scrollY"    : 400,
   "searching"  : false,
   "responsive" : true,
   "stateSave"  : true,
});

// Add event listener for opening and closing details
$('#txlist tbody').on('click', 'td.details-control', function () {
    var tr = $(this).closest('tr');
    var row = table.row( tr );
    if ( row.child.isShown() ) {
        // This row is already open - close it
        row.child.hide();
        tr.removeClass('shown');
    } else {
        // Open this row
        row.child( format(row.data()) ).show();
        tr.addClass('shown');
    }
} );
/* Formatting function for row details - modify as you need */
function format ( d ) {
    return '<pre>'+JSON.stringify(d.tx,null,' ')+'</pre>';
}

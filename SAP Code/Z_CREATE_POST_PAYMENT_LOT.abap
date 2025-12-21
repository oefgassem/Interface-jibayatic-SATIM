REPORT z_create_post_payment_lot_realhdr.

*----------------------------------------------------------------
* Create payment lot
*----------------------------------------------------------------

DATA: lv_return        TYPE bapiret2,
      lt_return        TYPE TABLE OF bapiret2,
      ls_paylot_hdr    TYPE bapidfkkzk,
      ls_msg           TYPE bapiret2.

* ----------------------------------------------------------------
* Fill payment lot header using the fields from SATIM
* ----------------------------------------------------------------
CLEAR ls_paylot_hdr.

" Header fields
ls_paylot_hdr-doc_type              = 'EC'.                 " DOC_TYPE We need to check with DGI if they will use this doc type
ls_paylot_hdr-comp_code             = 'CDI'.                " COMP_CODE (BUKRS) Variable
ls_paylot_hdr-bus_area              = '19A'.               " BUS_AREA (if used) Variable
ls_paylot_hdr-post_date             = sy-datum.             " POST_DATE (BUDAT_KK)
ls_paylot_hdr-doc_date              = sy-datum.             " DOC_DATE (BLDAT)
ls_paylot_hdr-value_date            = sy-datum.             " VALUE_DATE (VALUT)

ls_paylot_hdr-search_term           = 'SATIM_IMPORT_TEST'.  " SEARCH_TERM 
ls_paylot_hdr-fikey                 = 'REF-12345'.          " FIKEY reconciliation key
ls_paylot_hdr-bank_cl_account       = '1100056000'.         " BANK_CL_ACCOUNT
ls_paylot_hdr-currency              = 'DZD'.                " CURRENCY (WAERS)
ls_paylot_hdr-currency_iso          = 'DZD'.                " CURRENCY_ISO
ls_paylot_hdr-exch_rate             = '1.00000'.            " EXCH_RATE (KURSF)

ls_paylot_hdr-line_item             = 'X'.                  " LINE_ITEM (XEIPH_KK)
ls_paylot_hdr-clear_reas            = '01'.                 " CLEAR_REAS (AUGRD_KK)

ls_paylot_hdr-additional_info       = 'Imported from SATIM middleware'.
ls_paylot_hdr-payment_order_lot     = 'X'.                  " XZAUS_KK
ls_paylot_hdr-check_lot             = ' '.                  " XSCHS_KK
ls_paylot_hdr-check_deposit_account = '1000022000'.         " CHECK_DEPOSIT_ACCOUNT (VKOCH_KK)
ls_paylot_hdr-no_check_deposit      = ' '.                  " NO_CHECK_DEPOSIT (XNSEB_KK)
ls_paylot_hdr-profit_ctr            = ''.             " PROFIT_CTR / PRCTR

" Optional: PAYMENT_LOT left blank to let system assign a lot number:
ls_paylot_hdr-payment_lot           = 'SAT006'.                   " PAYMENT_LOT (let system assign)

" ----------------------------------------------------------------
" 1) Call BAPI to create the payment lot
" ----------------------------------------------------------------
CLEAR lv_return.
CALL FUNCTION 'BAPI_CTRACPAYMINC_CREATE'
  EXPORTING
    paymentlotheader = ls_paylot_hdr
  IMPORTING
    return           = lv_return.

" Collect message and show to user
APPEND lv_return TO lt_return.

IF lv_return-type = 'E' OR lv_return-type = 'A'.
  LOOP AT lt_return INTO ls_msg.
    WRITE: / 'BAPI Create - ERROR/ABORT:', ls_msg-message.
  ENDLOOP.
  " No commit on error
  EXIT.
ELSE.
  LOOP AT lt_return INTO ls_msg.
    WRITE: / 'BAPI Create - OK   :', ls_msg-message.
  ENDLOOP.
ENDIF.

" ----------------------------------------------------------------
" 2) Commit the BAPI changes (only when no errors)
" ----------------------------------------------------------------
CALL FUNCTION 'BAPI_TRANSACTION_COMMIT'
  EXPORTING
    wait = 'X'.

WRITE: / 'Payment lot create call finished. Check table DFKKZK for the created lot.'.
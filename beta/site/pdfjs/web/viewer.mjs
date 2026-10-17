import {createPdfViewer} from '../../shared/pdf-viewer.mjs';
import {resolveViewerPdf} from './viewer-link.mjs';

const pdf=resolveViewerPdf(location.search,location.href);
const error=document.querySelector('#viewer-error');
const reopen=document.querySelector('#viewer-reopen');
if(!pdf){error.hidden=false;}
else{
  const name=decodeURIComponent(pdf.pathname.split('/').at(-1));
  document.title=`${name} | AV Portal`;
  const viewer=createPdfViewer();
  const show=()=>viewer.open({file:pdf.href,title:name,sourceUrl:pdf.href,trigger:reopen});
  reopen.hidden=false;
  reopen.addEventListener('click',show);
  show();
}

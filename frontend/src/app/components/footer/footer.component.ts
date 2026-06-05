import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
  ownerName = 'Intikhab Khursheed';
  ownerTitle = 'Founder & Developer';
  ownerPhone = '+92 335 99199883';
  ownerEmail = 'intikhab.khursheed@gmail.com';
}

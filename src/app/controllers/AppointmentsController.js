import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore} from 'date-fns'
import User from '../models/User'

import Appointment from '../models/Appointment';


class AppointmentsController {
    async store(req, res) {
        const schema = Yup.object().shape({
            provider_id: Yup.number().required(),
            date: Yup.date().required(),
        });

        if (!(await schema.isValid(req.body))) {
            return res.status(400).json({ error: 'Validation fails'})
        }

        const { provider_id, date } = req.body;

        //chegar se é o provider_id pertence ao um provider

        const checkProvider = await User.findOne({
            where: { id: provider_id, provider: true },
        });

        if (!checkProvider) {
            return res.status(401).json({ error: 'You can only create appointments with providers'})
        }

        const hourStart = startOfHour(parseISO(date));

        //ver se a hora já passou da hora atual
        if (isBefore(hourStart, new Date())) {
            return res.status(400).json({ error:  'Past dates are not permitted'})
        }

        //se tem um agendamento no messmo horario

        const checkAvailability = await Appointment.findOne({
            where: {
                provider_id,
                canceled_at: null,
                date: hourStart,
            }
        });

        if (checkAvailability) {
            return res.status(400).json({ error: "Appoitmente date is not available"})
        }


        const appointment = await Appointment.create({
            user_id: req.userId,
            provider_id,
            date,
        })

        return res.json(appointment);
    }
}

export default new AppointmentsController();
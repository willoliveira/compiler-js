
import axios from "axios";

class BaseRepository {

    static get(url) {
        return axios.get(url);
    }

    static post(url, data) {
        return axios.post(url, data);
    }

    static put(url, data) {
        return axios.put(url, data);
    }

    static delete(url) {
        return axios.delete(url);
    }
}

export default BaseRepository;